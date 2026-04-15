interface ApiSuccess<T> {
  status?: number;
  message?: string;
  data?: T | null;
}

export interface ApiError<T = unknown> {
  status: number;
  message: string;
  errors?: T;
  code?: string;
  success: false;
}
