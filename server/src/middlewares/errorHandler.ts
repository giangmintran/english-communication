import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && statusCode === 500
    ? 'Đã xảy ra lỗi máy chủ nội bộ'
    : (err.message || 'Internal Server Error');
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  return sendError(res, message, statusCode, code, isProd ? undefined : err.details);
}
