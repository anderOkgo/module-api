import { Request, Response } from 'express';
import { BodyCipher } from '../../application/ports/body-cipher';
import { isUserId, unauthorized, UseCaseResult } from '../../application/use-cases/use-case-result';
import { GetHomeUseCase } from '../../application/use-cases/get-home.use-case';
import { GetNearbyUseCase } from '../../application/use-cases/get-nearby.use-case';
import { GetEntryUseCase } from '../../application/use-cases/get-entry.use-case';
import { SaveEntryUseCase } from '../../application/use-cases/save-entry.use-case';
import { DeleteEntryUseCase } from '../../application/use-cases/delete-entry.use-case';
import { ListMonthUseCase } from '../../application/use-cases/list-month.use-case';
import { ListTrashUseCase } from '../../application/use-cases/list-trash.use-case';
import { RestoreEntryUseCase } from '../../application/use-cases/restore-entry.use-case';
import { ImportEntriesUseCase } from '../../application/use-cases/import-entries.use-case';
import { SearchEntriesUseCase } from '../../application/use-cases/search-entries.use-case';
import {
  ChangeKeyUseCase,
  CreateKeyUseCase,
  GetKeyUseCase,
  OpenDiaryUseCase,
} from '../../application/use-cases/diary-key.use-cases';
import { KEY_HEADER, NEW_KEY_HEADER } from '../../domain/services/key-rules';

export interface BitacoraUseCases {
  getHome: GetHomeUseCase;
  getNearby: GetNearbyUseCase;
  getEntry: GetEntryUseCase;
  saveEntry: SaveEntryUseCase;
  deleteEntry: DeleteEntryUseCase;
  listMonth: ListMonthUseCase;
  listTrash: ListTrashUseCase;
  restoreEntry: RestoreEntryUseCase;
  importEntries: ImportEntriesUseCase;
  searchEntries: SearchEntriesUseCase;
  getKey: GetKeyUseCase;
  createKey: CreateKeyUseCase;
  changeKey: ChangeKeyUseCase;
  openDiary: OpenDiaryUseCase;
}

/**
 * Thin HTTP adapter: reads the token's `userId` (set by validate-token, D1),
 * calls one use case and sends its result in the D3 envelope
 * `{ success, message, data? , errors? }`. Swagger: bitacora.swagger.ts.
 *
 * Diary routes (C2–C14) open the diary first (SPEC v1.11 §3.5): after the
 * token (401), the key header decides 428 / 403, and only then does the use
 * case run, with the request's body cipher.
 *
 * Never logs request bodies, headers or error objects (N2): a driver error
 * carries the SQL text, and the key header is a secret. Only the error
 * message is logged.
 */
export class BitacoraController {
  constructor(private readonly useCases: BitacoraUseCases) {}

  getHome = (req: Request, res: Response) =>
    this.diary('getHome', req, res, (userId, cipher) => this.useCases.getHome.execute(userId, req.params.date, cipher));

  getNearby = (req: Request, res: Response) =>
    this.diary('getNearby', req, res, (userId, cipher) =>
      this.useCases.getNearby.execute(userId, req.params.date, cipher)
    );

  getEntry = (req: Request, res: Response) =>
    this.diary('getEntry', req, res, (userId, cipher) => this.useCases.getEntry.execute(userId, req.params.date, cipher));

  saveEntry = (req: Request, res: Response) =>
    this.diary('saveEntry', req, res, (userId, cipher) =>
      this.useCases.saveEntry.execute(userId, req.params.date, req.body, cipher)
    );

  deleteEntry = (req: Request, res: Response) =>
    this.diary('deleteEntry', req, res, (userId) => this.useCases.deleteEntry.execute(userId, req.params.date));

  listMonth = (req: Request, res: Response) =>
    this.diary('listMonth', req, res, (userId) => this.useCases.listMonth.execute(userId, req.query.month));

  listTrash = (req: Request, res: Response) =>
    this.diary('listTrash', req, res, (userId, cipher) => this.useCases.listTrash.execute(userId, cipher));

  restoreEntry = (req: Request, res: Response) =>
    this.diary('restoreEntry', req, res, (userId, cipher) =>
      this.useCases.restoreEntry.execute(userId, req.params.date, req.body, cipher)
    );

  importEntries = (req: Request, res: Response) =>
    this.diary('importEntries', req, res, (userId, cipher) =>
      this.useCases.importEntries.execute(userId, req.body, cipher)
    );

  searchEntries = (req: Request, res: Response) =>
    this.diary('searchEntries', req, res, (userId, cipher) =>
      this.useCases.searchEntries.execute(userId, req.body, cipher)
    );

  getKey = (req: Request, res: Response) => this.run('getKey', res, () => this.useCases.getKey.execute(req.body.userId));

  createKey = (req: Request, res: Response) =>
    this.run('createKey', res, () =>
      this.useCases.createKey.execute(req.body.userId, req.body, req.headers[KEY_HEADER])
    );

  changeKey = (req: Request, res: Response) =>
    this.run('changeKey', res, () =>
      this.useCases.changeKey.execute(req.body.userId, req.body, req.headers[KEY_HEADER], req.headers[NEW_KEY_HEADER])
    );

  /** Opens the diary (401, then 428 / 403), then runs `work` with the user's body cipher. */
  private diary(
    name: string,
    req: Request,
    res: Response,
    work: (userId: number, cipher: BodyCipher) => Promise<UseCaseResult>
  ): Promise<Response> {
    return this.run(name, res, async () => {
      const userId = req.body.userId;
      if (!isUserId(userId)) return unauthorized();
      const opened = await this.useCases.openDiary.execute(userId, req.headers[KEY_HEADER]);
      if ('refusal' in opened) return opened.refusal;
      return work(userId, opened.cipher);
    });
  }

  private async run(name: string, res: Response, work: () => Promise<UseCaseResult>): Promise<Response> {
    try {
      const { status, success, message, data, errors } = await work();
      return res.status(status).json({ success, message, data, errors });
    } catch (error) {
      console.error(`Bitacora ${name} failed:`, error instanceof Error ? error.message : 'unknown error');
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
