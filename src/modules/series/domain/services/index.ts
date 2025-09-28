import { getSeriesService } from './series.factory';

export const getProductionsService = async (production: any) => {
  const seriesService = getSeriesService();
  return await seriesService.getAllSeries(production.limit || 50, production.offset || 0);
};

export const getProductionYearsService = async () => {
  const seriesService = getSeriesService();
  return await seriesService.getProductionYears();
};
