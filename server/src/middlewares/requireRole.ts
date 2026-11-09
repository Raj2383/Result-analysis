import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

/** Role gate – use on routes, never inline role checks. e.g. requireRole('faculty'), requireRole('faculty', 'admin'). */
export function requireRole(...allowed: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Not authenticated'));
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(new ApiError(403, 'Insufficient permissions'));
      return;
    }
    next();
  };
}

export default requireRole;
