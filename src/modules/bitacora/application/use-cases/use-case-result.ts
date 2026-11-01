/**
 * Result of every Bitácora use case (SPEC D2): expected failures are returned,
 * never thrown. `status` is the HTTP status the controller sends; the
 * controller turns the rest into the D3 envelope.
 */
export interface UseCaseResult<T = unknown> {
  success: boolean;
  status: 200 | 201 | 400 | 401 | 404 | 409;
  message: string;
  data?: T;
  errors?: string[];
}

export type Clock = () => Date;
export const systemClock: Clock = () => new Date();

export const succeed = <T>(data: T, message: string, status: 200 | 201 = 200): UseCaseResult<T> => ({
  success: true,
  status,
  message,
  data,
});

export const badRequest = (errors: string[]): UseCaseResult<never> => ({
  success: false,
  status: 400,
  message: 'Invalid request',
  errors,
});

export const unauthorized = (): UseCaseResult<never> => ({
  success: false,
  status: 401,
  message: 'Unauthorized: the token carries no user id',
});

export const notFound = (message: string): UseCaseResult<never> => ({ success: false, status: 404, message });

export const conflict = <T>(data: T, message: string): UseCaseResult<T> => ({
  success: false,
  status: 409,
  message,
  data,
});

/** D1: entries are keyed by the numeric `userId` from the token; anything else is a 401. */
export const isUserId = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

export const INVALID_DATE = 'date must be a real calendar date (YYYY-MM-DD) between 1900-01-01 and tomorrow';
