import { getSeriesService } from './series.factory';

export const getProductionsService = async (production: any) => {
  const seriesService = getSeriesService();
  return await seriesService.getProductionsWithView(production);
};

export const getProductionYearsService = async () => {
  const seriesService = getSeriesService();
  return await seriesService.getProductionYears();
};
