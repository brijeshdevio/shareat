import { Response } from 'express';
import { ApiError, ApiSuccess } from '../types/api';

export const sendSuccess = <T>({ status, message, data }: ApiSuccess<T>) => {
  status = status ?? 200;
  data = data ?? null;
  return { success: true, status, message, data };
};

export const sendError = <T>({
  status = 400,
  message,
  errors,
  code,
}: Partial<ApiError<T>>) => {
  status = status ?? 400;
  return {
    success: false,
    status,
    message,
    errors,
    code,
  };
};
