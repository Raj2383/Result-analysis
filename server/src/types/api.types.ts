/** Standard API response envelope: { success, data, message } (+ optional errors[]). */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors?: unknown[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export type ApiErrorBody = ApiResponse<unknown> & { errors?: unknown[] };
