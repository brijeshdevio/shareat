import { ApiSuccess } from '../types/api.types';

export const sendSuccess = <T>({
  statusCode,
  message,
  data,
  meta,
}: ApiSuccess<T>) => {
  statusCode = statusCode ?? 200;
  data = data ?? null;

  return { success: true, statusCode, message, data, ...(meta && { meta }) };
};
