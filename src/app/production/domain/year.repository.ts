import Year from './models/Year';
export interface YearRepository {
  getYears(): Year;
}
