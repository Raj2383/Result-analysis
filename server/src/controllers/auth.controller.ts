import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import authService, { cookieMaxAgeMs } from '../services/auth.service';
import env from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { Request, Response } from 'express';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.nodeEnv === 'production',
    path: '/',
    maxAge: cookieMaxAgeMs(),
  };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body);
  res.cookie(env.jwt.cookieName, token, cookieOptions());
  return apiResponse(res, { data: { user }, message: 'Logged in' });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.jwt.cookieName, { path: '/', httpOnly: true, sameSite: 'lax' as const });
  return apiResponse(res, { data: null, message: 'Logged out' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Not authenticated');
  const user = await authService.getMe(userId);
  return apiResponse(res, { data: { user }, message: 'OK' });
});

export default { login, logout, me };
