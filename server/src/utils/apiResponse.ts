import { Response } from 'express';
import { ApiEnvelope, ApiResponse } from '../types/api.types';

export interface ApiResponseOptions<T> {
  status?: number;
  data?: T | null;
  message?: string;
}

/** Send the standardized { success, data, message } JSON envelope. */
export function apiResponse<T>(res: Response, options: ApiResponseOptions<T> = {}): Response {
  const { status = 200, data = null, message = 'OK' } = options;
  const body: ApiResponse<T> = { success: status < 400, data, message };
  return res.status(status).json(body);
}

export default apiResponse;
