import { Request, Response } from 'express';
import { UseCaseResult } from '../../application/use-cases/use-case-result';
import { GetHomeUseCase } from '../../application/use-cases/get-home.use-case';
import { GetNearbyUseCase } from '../../application/use-cases/get-nearby.use-case';
import { GetEntryUseCase } from '../../application/use-cases/get-entry.use-case';
import { SaveEntryUseCase } from '../../application/use-cases/save-entry.use-case';
import { DeleteEntryUseCase } from '../../application/use-cases/delete-entry.use-case';
import { ListMonthUseCase } from '../../application/use-cases/list-month.use-case';
import { ListTrashUseCase } from '../../application/use-cases/list-trash.use-case';
import { RestoreEntryUseCase } from '../../application/use-cases/restore-entry.use-case';
import { ImportEntriesUseCase } from '../../application/use-cases/import-entries.use-case';

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
}

/**
 * Thin HTTP adapter: reads the token's `userId` (set by validate-token, D1),
 * calls one use case and sends its result in the D3 envelope
 * `{ success, message, data? , errors? }`. Swagger: bitacora.swagger.ts.
 *
 * Never logs request bodies or error objects (N2): a driver error carries the
 * SQL text, which may contain entry text. Only the error message is logged.
 */
export class BitacoraController {
  constructor(private readonly useCases: BitacoraUseCases) {}

  getHome = (req: Request, res: Response) =>
    this.run('getHome', res, () => this.useCases.getHome.execute(req.body.userId, req.params.date));

  getNearby = (req: Request, res: Response) =>
    this.run('getNearby', res, () => this.useCases.getNearby.execute(req.body.userId, req.params.date));

  getEntry = (req: Request, res: Response) =>
    this.run('getEntry', res, () => this.useCases.getEntry.execute(req.body.userId, req.params.date));

  saveEntry = (req: Request, res: Response) =>
    this.run('saveEntry', res, () => this.useCases.saveEntry.execute(req.body.userId, req.params.date, req.body));

  deleteEntry = (req: Request, res: Response) =>
    this.run('deleteEntry', res, () => this.useCases.deleteEntry.execute(req.body.userId, req.params.date));

  listMonth = (req: Request, res: Response) =>
    this.run('listMonth', res, () => this.useCases.listMonth.execute(req.body.userId, req.query.month));

  listTrash = (req: Request, res: Response) =>
    this.run('listTrash', res, () => this.useCases.listTrash.execute(req.body.userId));

  restoreEntry = (req: Request, res: Response) =>
    this.run('restoreEntry', res, () =>
      this.useCases.restoreEntry.execute(req.body.userId, req.params.date, req.body)
    );

  importEntries = (req: Request, res: Response) =>
    this.run('importEntries', res, () => this.useCases.importEntries.execute(req.body.userId, req.body));

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
