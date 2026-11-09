import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../types/api.types';

export interface ErrorBody extends ApiResponse<unknown> {
  errors?: unknown[];
}

/** Central error handler – must be registered last. Keeps the { success, data, message } shape. */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const status = err instanceof ApiError ? err.statusCode : (err as Error & { statusCode?: number }).statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message || 'Error';
  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  const body: ErrorBody = {
    success: false,
    data: null,
    message,
    ...(err instanceof ApiError && err.details !== undefined ? { errors: [err.details] } : {}),
  };
  res.status(status).json(body);
}
