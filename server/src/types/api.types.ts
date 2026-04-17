export interface ApiSuccess<T> {
  statusCode: number;
  message?: string;
  data?: T | null;
  meta?: Record<string | number, unknown>;
}
