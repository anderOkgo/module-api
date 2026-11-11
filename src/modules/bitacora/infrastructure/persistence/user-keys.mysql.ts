import { Database } from '../../../../infrastructure/my.database.helper';
import { UserKeyRecord, UserKeyRepository } from '../../application/ports/diary-key.ports';

/**
 * `user_keys` in `animecre_bitacora` (SPEC v1.11 §4.6, `module-data` migration 0002). Every
 * statement filters by `user_id = ?` (D8). Queries throw (no `executeSafeQuery`), like the entries
 * repository, so no SQL text reaches an e-mail or a log.
 */
export class UserKeysMysqlRepository implements UserKeyRepository {
  constructor(private readonly database: Database) {}

  async findKey(userId: number): Promise<UserKeyRecord | null> {
    const rows: Array<{ kdf: string; iterations: number | string; salt: string; wrappedDek: string }> =
      await this.database.executeQuery(
        `SELECT kdf, kdf_iterations AS iterations, kdf_salt AS salt, wrapped_dek AS wrappedDek
         FROM user_keys WHERE user_id = ?`,
        [userId]
      );
    if (rows.length === 0) return null;
    const { kdf, iterations, salt, wrappedDek } = rows[0];
    return { kdf, iterations: Number(iterations), salt, wrappedDek };
  }

  async createKey(userId: number, record: UserKeyRecord): Promise<boolean> {
    try {
      await this.database.executeQuery(
        `INSERT INTO user_keys (user_id, kdf, kdf_iterations, kdf_salt, wrapped_dek, created, modified)
         VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [userId, record.kdf, record.iterations, record.salt, record.wrappedDek]
      );
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') return false;
      throw error;
    }
  }

  async replaceKey(userId: number, record: UserKeyRecord): Promise<void> {
    await this.database.executeQuery(
      `UPDATE user_keys SET kdf = ?, kdf_iterations = ?, kdf_salt = ?, wrapped_dek = ?, modified = UTC_TIMESTAMP()
       WHERE user_id = ?`,
      [record.kdf, record.iterations, record.salt, record.wrappedDek, userId]
    );
  }
}
