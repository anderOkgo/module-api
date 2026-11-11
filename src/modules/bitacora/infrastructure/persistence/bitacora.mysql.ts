import { Database, QueryExecutor } from '../../../../infrastructure/my.database.helper';
import { BitacoraRepository, RestoreOutcome, SaveOutcome } from '../../application/ports/bitacora.repository';
import { BodyCipher } from '../../application/ports/body-cipher';
import {
  Entry,
  ImportConflictPolicy,
  ImportItem,
  ImportResult,
  MonthDay,
  RestoreConflictPolicy,
  SearchPage,
  TrashRow,
} from '../../domain/entities/entry.entity';
import { TRASH_DAYS } from '../../domain/services/entry-dates';
import { KEEP_BOTH_SEPARATOR, PREVIEW_CHARS, termMatcher } from '../../domain/services/entry-rules';

/**
 * MySQL/MariaDB implementation of the Bitácora port (SPEC §4,
 * `module-data/schemas/bitacora-data`). Rules kept here:
 * - every statement filters by `user_id = ?` first (D8, N1);
 * - dates and timestamps are formatted in SQL, so the driver never converts
 *   them through the server's time zone (D4); timestamps are written with
 *   `UTC_TIMESTAMP()`;
 * - queries throw (no `executeSafeQuery`): its error e-mail and log would carry
 *   the SQL text (N2). The controller logs only the error message;
 * - `body` is ciphertext in the database (SPEC v1.11 §4.6, D32): it is
 *   encrypted right before every write and decrypted right after every read,
 *   with the request's cipher. SQL never looks inside a body: moving a row
 *   between `entries` and `entries_trash` copies the ciphertext as is (same
 *   user and date, so it still decrypts), and previews, "keep both" and search
 *   work on decrypted text here.
 */

const ENTRY_COLUMNS = `DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body, version,
  DATE_FORMAT(modified, '%Y-%m-%dT%H:%i:%sZ') AS modified`;
const SELECT_ENTRY = `SELECT ${ENTRY_COLUMNS} FROM entries WHERE user_id = ? AND entry_date = ?`;
const WITHIN_TRASH_WINDOW = `deleted_at >= UTC_TIMESTAMP() - INTERVAL ${TRASH_DAYS} DAY`;
const PURGE_EXPIRED = `DELETE FROM entries_trash WHERE user_id = ? AND deleted_at < UTC_TIMESTAMP() - INTERVAL ${TRASH_DAYS} DAY`;

/** Errors a concurrent first save of the same date can raise; both mean "someone else inserted it". */
const RACE_ERRORS = ['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK'];

const toEntry = (row: Entry, cipher: BodyCipher): Entry => ({
  date: row.date,
  body: cipher.decrypt(row.date, row.body),
  version: Number(row.version),
  modified: row.modified,
});

/** The first `PREVIEW_CHARS` characters (code points, like SQL `LEFT`). */
const preview = (text: string): string => [...text].slice(0, PREVIEW_CHARS).join('');

export class BitacoraMysqlRepository implements BitacoraRepository {
  /** One pool for the module: the entries and the keys repositories share it. */
  constructor(private readonly database: Database = new Database('MYDATABASEBITACORA')) {}

  async findEntry(userId: number, date: string, cipher: BodyCipher): Promise<Entry | null> {
    const rows: Entry[] = await this.database.executeQuery(SELECT_ENTRY, [userId, date]);
    return rows.length > 0 ? toEntry(rows[0], cipher) : null;
  }

  async hasEntry(userId: number, date: string): Promise<boolean> {
    const rows = await this.database.executeQuery(
      'SELECT 1 FROM entries WHERE user_id = ? AND entry_date = ? LIMIT 1',
      [userId, date]
    );
    return rows.length > 0;
  }

  async findByMonthDays(userId: number, pairs: MonthDay[], cipher: BodyCipher): Promise<Entry[]> {
    const tuples = pairs.map(() => '(?, ?)').join(', ');
    const rows: Entry[] = await this.database.executeQuery(
      `SELECT ${ENTRY_COLUMNS} FROM entries
       WHERE user_id = ? AND (MONTH(entry_date), DAY(entry_date)) IN (${tuples})
       ORDER BY entry_date DESC`,
      [userId, ...pairs.flatMap((p) => [p.month, p.day])]
    );
    return rows.map((row) => toEntry(row, cipher));
  }

  async listDates(userId: number, from: string, to: string): Promise<string[]> {
    const rows: Array<{ date: string }> = await this.database.executeQuery(
      `SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date FROM entries
       WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date`,
      [userId, from, to]
    );
    return rows.map((row) => row.date);
  }

  async saveEntry(
    userId: number,
    date: string,
    body: string,
    baseVersion: number | null,
    cipher: BodyCipher
  ): Promise<SaveOutcome> {
    try {
      return await this.database.runInTransaction(async (query) => {
        const current = await this.lockEntry(query, userId, date, cipher);
        if (!current) {
          // No stored entry: create it. A non-null baseVersion here means the entry was deleted
          // elsewhere; the text being typed is kept (the deleted one is still in the trash).
          await query(
            `INSERT INTO entries (user_id, entry_date, body, version, created, modified)
             VALUES (?, ?, ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
            [userId, date, cipher.encrypt(date, body)]
          );
          return { kind: 'created', entry: await this.readEntry(query, userId, date, cipher) } as SaveOutcome;
        }
        if (current.version !== baseVersion) return { kind: 'conflict', entry: current } as SaveOutcome;

        await query(
          `UPDATE entries SET body = ?, version = version + 1, modified = UTC_TIMESTAMP()
           WHERE user_id = ? AND entry_date = ?`,
          [cipher.encrypt(date, body), userId, date]
        );
        return { kind: 'replaced', entry: await this.readEntry(query, userId, date, cipher) } as SaveOutcome;
      });
    } catch (error) {
      // Two first saves of the same date at once: the loser sees the winner's entry as a conflict.
      const current = RACE_ERRORS.includes((error as { code?: string }).code as string)
        ? await this.findEntry(userId, date, cipher)
        : null;
      if (!current) throw error;
      return { kind: 'conflict', entry: current };
    }
  }

  async moveToTrash(userId: number, date: string): Promise<{ deletedAt: string } | null> {
    return this.database.runInTransaction(async (query) => {
      await query(PURGE_EXPIRED, [userId]);
      const locked = await query('SELECT 1 FROM entries WHERE user_id = ? AND entry_date = ? FOR UPDATE', [userId, date]);
      if (locked.length === 0) return null;

      // The ciphertext moves as is: same user and date, so it still decrypts from the trash.
      const inserted = await query(
        `INSERT INTO entries_trash (user_id, entry_date, body, version, created, modified, deleted_at)
         SELECT user_id, entry_date, body, version, created, modified, UTC_TIMESTAMP()
         FROM entries WHERE user_id = ? AND entry_date = ?`,
        [userId, date]
      );
      await query('DELETE FROM entries WHERE user_id = ? AND entry_date = ?', [userId, date]);
      const rows = await query(
        `SELECT DATE_FORMAT(deleted_at, '%Y-%m-%dT%H:%i:%sZ') AS deletedAt
         FROM entries_trash WHERE id = ? AND user_id = ?`,
        [inserted.insertId, userId]
      );
      return { deletedAt: rows[0].deletedAt as string };
    });
  }

  async listTrash(userId: number, cipher: BodyCipher): Promise<TrashRow[]> {
    await this.database.executeQuery(PURGE_EXPIRED, [userId]);
    const rows: Array<{ date: string; body: string; deletedAt: string }> = await this.database.executeQuery(
      `SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body,
         DATE_FORMAT(deleted_at, '%Y-%m-%dT%H:%i:%sZ') AS deletedAt
       FROM entries_trash WHERE user_id = ? AND ${WITHIN_TRASH_WINDOW}
       ORDER BY deleted_at DESC, id DESC`,
      [userId]
    );
    return rows.map((row) => ({
      date: row.date,
      preview: preview(cipher.decrypt(row.date, row.body)),
      deletedAt: row.deletedAt,
    }));
  }

  async restoreFromTrash(
    userId: number,
    date: string,
    onConflict: RestoreConflictPolicy,
    cipher: BodyCipher
  ): Promise<RestoreOutcome> {
    return this.database.runInTransaction(async (query): Promise<RestoreOutcome> => {
      await query(PURGE_EXPIRED, [userId]);
      const trashed: Array<{ id: number; body: string }> = await query(
        `SELECT id, body FROM entries_trash
         WHERE user_id = ? AND entry_date = ? AND ${WITHIN_TRASH_WINDOW}
         ORDER BY deleted_at DESC, id DESC LIMIT 1 FOR UPDATE`,
        [userId, date]
      );
      if (trashed.length === 0) return { kind: 'notFound' };
      const trashId = trashed[0].id;
      const deletedBody = cipher.decrypt(date, trashed[0].body);

      const current = await this.lockEntry(query, userId, date, cipher);
      if (current && onConflict === 'fail') return { kind: 'conflict', entry: current };

      if (current) {
        const body = onConflict === 'replace' ? deletedBody : `${current.body}${KEEP_BOTH_SEPARATOR}${deletedBody}`;
        await query(
          `UPDATE entries SET body = ?, version = version + 1, modified = UTC_TIMESTAMP()
           WHERE user_id = ? AND entry_date = ?`,
          [cipher.encrypt(date, body), userId, date]
        );
      } else {
        await query(
          `INSERT INTO entries (user_id, entry_date, body, version, created, modified)
           SELECT user_id, entry_date, body, version + 1, created, UTC_TIMESTAMP()
           FROM entries_trash WHERE id = ? AND user_id = ?`,
          [trashId, userId]
        );
      }
      await query('DELETE FROM entries_trash WHERE id = ? AND user_id = ?', [trashId, userId]);
      return { kind: 'restored', entry: await this.readEntry(query, userId, date, cipher) };
    });
  }

  async searchEntries(
    userId: number,
    terms: string[],
    limit: number,
    offset: number,
    cipher: BodyCipher
  ): Promise<SearchPage> {
    // The database holds ciphertext only: read the user's days, newest first, and match here.
    const rows: Array<{ date: string; body: string }> = await this.database.executeQuery(
      `SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body FROM entries
       WHERE user_id = ? ORDER BY entry_date DESC`,
      [userId]
    );
    const matches = termMatcher(terms);
    const found = rows
      .map((row) => ({ date: row.date, body: cipher.decrypt(row.date, row.body) }))
      .filter((row) => matches(row.body));
    return { total: found.length, rows: found.slice(offset, offset + limit) };
  }

  async importEntries(
    userId: number,
    items: ImportItem[],
    onConflict: ImportConflictPolicy,
    cipher: BodyCipher
  ): Promise<ImportResult> {
    return this.database.runInTransaction(async (query) => {
      const existingRows: Array<{ date: string }> = await query(
        `SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date FROM entries
         WHERE user_id = ? AND entry_date IN (?) FOR UPDATE`,
        [userId, items.map((item) => item.date)]
      );
      const existing = new Set(existingRows.map((row) => row.date));
      const overwrite = onConflict === 'overwrite';
      const toWrite = overwrite ? items : items.filter((item) => !existing.has(item.date));

      if (toWrite.length > 0) {
        const values = toWrite.map(() => '(?, ?, ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())').join(', ');
        const onDuplicate = overwrite
          ? ' ON DUPLICATE KEY UPDATE body = VALUES(body), version = version + 1, modified = UTC_TIMESTAMP()'
          : '';
        await query(
          `INSERT INTO entries (user_id, entry_date, body, version, created, modified) VALUES ${values}${onDuplicate}`,
          toWrite.flatMap((item) => [userId, item.date, cipher.encrypt(item.date, item.body)])
        );
      }

      const result: ImportResult = { created: [], overwritten: [], skipped: [] };
      for (const { date } of items) {
        if (!existing.has(date)) result.created.push(date);
        else if (overwrite) result.overwritten.push(date);
        else result.skipped.push(date);
      }
      return result;
    });
  }

  private async lockEntry(
    query: QueryExecutor,
    userId: number,
    date: string,
    cipher: BodyCipher
  ): Promise<Entry | null> {
    const rows: Entry[] = await query(`${SELECT_ENTRY} FOR UPDATE`, [userId, date]);
    return rows.length > 0 ? toEntry(rows[0], cipher) : null;
  }

  private async readEntry(query: QueryExecutor, userId: number, date: string, cipher: BodyCipher): Promise<Entry> {
    const rows: Entry[] = await query(SELECT_ENTRY, [userId, date]);
    return toEntry(rows[0], cipher);
  }
}
