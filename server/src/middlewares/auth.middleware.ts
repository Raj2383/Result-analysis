import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface AuthUser {
  id: number;
  role: string;
  username: string | null;
}

/** Reads JWT from httpOnly cookie, attaches req.user = { id, role, username }. Faculty/admin only – no student sessions. */
export function auth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.jwt.cookieName];
  if (!token) {
    next(new ApiError(401, 'Not authenticated'));
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwt.secret) as unknown as { sub: number; role?: string; username?: string };
    req.user = { id: payload.sub, role: payload.role || 'faculty', username: payload.username || null };
    next();
  } catch {
    next(new ApiError(401, 'Session expired – please log in again'));
  }
}

export default auth;
