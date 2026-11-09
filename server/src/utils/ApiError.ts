/** Standard API error. Throw these; the central error middleware formats the response. */
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(msg = 'Bad request', details?: unknown): ApiError {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Unauthorized'): ApiError {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Forbidden'): ApiError {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Not found'): ApiError {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict'): ApiError {
    return new ApiError(409, msg);
  }
}

export default ApiError;
