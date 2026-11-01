import express, { Router } from 'express';
import validateToken from '../../../../infrastructure/services/validate-token';
import { BitacoraController } from '../controllers/bitacora.controller';
import { BitacoraMysqlRepository } from '../persistence/bitacora.mysql';
import { GetHomeUseCase } from '../../application/use-cases/get-home.use-case';
import { GetNearbyUseCase } from '../../application/use-cases/get-nearby.use-case';
import { GetEntryUseCase } from '../../application/use-cases/get-entry.use-case';
import { SaveEntryUseCase } from '../../application/use-cases/save-entry.use-case';
import { DeleteEntryUseCase } from '../../application/use-cases/delete-entry.use-case';
import { ListMonthUseCase } from '../../application/use-cases/list-month.use-case';
import { ListTrashUseCase } from '../../application/use-cases/list-trash.use-case';
import { RestoreEntryUseCase } from '../../application/use-cases/restore-entry.use-case';
import { ImportEntriesUseCase } from '../../application/use-cases/import-entries.use-case';

/**
 * JSON body limit for /api/bitacora. The app-wide `express.json()` default
 * (100 kB) is below one 100,000-character entry in UTF-8 (SPEC A6) and below an
 * import batch of 1,000 entries (C11). Mounted in server.ts before the global
 * parser, which then skips the already-parsed body.
 */
export const bitacoraJsonParser = express.json({ limit: '10mb' });

/**
 * Composition root of the Bitácora module (module-docs/apps/bitacora/SPEC.md
 * v1.0 §3). Route order matters (§3.2): `/entries/import` and `/entries`
 * (month) before `/entries/:date`; `/entries/:date/nearby` before
 * `/entries/:date`.
 */
export function buildBitacoraModule() {
  const bitacoraRepository = new BitacoraMysqlRepository();

  const useCases = {
    getHome: new GetHomeUseCase(bitacoraRepository),
    getNearby: new GetNearbyUseCase(bitacoraRepository),
    getEntry: new GetEntryUseCase(bitacoraRepository),
    saveEntry: new SaveEntryUseCase(bitacoraRepository),
    deleteEntry: new DeleteEntryUseCase(bitacoraRepository),
    listMonth: new ListMonthUseCase(bitacoraRepository),
    listTrash: new ListTrashUseCase(bitacoraRepository),
    restoreEntry: new RestoreEntryUseCase(bitacoraRepository),
    importEntries: new ImportEntriesUseCase(bitacoraRepository),
  };

  const bitacoraController = new BitacoraController(useCases);

  const router = Router();
  router.get('/home/:date', validateToken, bitacoraController.getHome);
  router.post('/entries/import', validateToken, bitacoraController.importEntries);
  router.get('/entries', validateToken, bitacoraController.listMonth);
  router.get('/entries/:date/nearby', validateToken, bitacoraController.getNearby);
  router.get('/entries/:date', validateToken, bitacoraController.getEntry);
  router.put('/entries/:date', validateToken, bitacoraController.saveEntry);
  router.delete('/entries/:date', validateToken, bitacoraController.deleteEntry);
  router.get('/trash', validateToken, bitacoraController.listTrash);
  router.post('/trash/:date/restore', validateToken, bitacoraController.restoreEntry);

  return { router, bitacoraController, bitacoraRepository, ...useCases };
}
