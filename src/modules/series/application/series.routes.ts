import { router } from '../../../infrastructure/middle.helper';
import { getProductions, getProductionYears, defaultSeries } from './series.controller';

router.get('/series', defaultSeries);
router.post('/series', getProductions);
router.get('/series/years', getProductionYears);

export default router;
