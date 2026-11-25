import { Response } from 'express';

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: Record<string, any>
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): Response {
  const isProd = process.env.NODE_ENV === 'production';
  // Ở môi trường production, không để lộ thông tin lỗi nội bộ / schema cơ sở dữ liệu khi gặp lỗi 5xx
  const safeMessage = isProd && statusCode >= 500
    ? 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.'
    : message;

  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: code || `HTTP_${statusCode}`,
      message: safeMessage,
      ...(details !== undefined && !isProd ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}
