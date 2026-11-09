import jwt from 'jsonwebtoken';
import env from '../config/env';
import { ApiError } from '../utils/ApiError';
import { hashPassword, comparePassword } from '../utils/hash';
import usersRepo from '../repositories/users.repository';

export interface AuthUserPayload {
  id: number;
  role: string;
  username: string;
  name?: string | null;
  email?: string | null;
}

/** Strip secret fields before sending a user to the client. */
export function toSafeUser(row: Record<string, unknown> | null): AuthUserPayload | null {
  if (!row) return null;
  return {
    id: Number(row.id),
    role: String(row.role),
    username: String(row.username),
    name: row.name ? String(row.name) : null,
    email: row.email ? String(row.email) : null,
  };
}

/** Sign a JWT with { sub, role, username }. */
export function signToken(user: AuthUserPayload): string {
  return jwt.sign({ sub: user.id, role: user.role, username: user.username }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/** Cookie max-age in ms, derived from JWT_EXPIRES_IN (e.g. '1d', '12h'). */
export function cookieMaxAgeMs(): number {
  const m = /^(\d+)([smhd])$/.exec(env.jwt.expiresIn || '');
  if (!m) return 24 * 60 * 60 * 1000;
  const mults: Record<string, number> = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  const mult = mults[m[2] ?? 'd'];
  return Number(m[1]) * mult;
}

export interface AuthServiceDeps {
  users?: typeof usersRepo;
  hasher?: { hashPassword: (p: string) => Promise<string>; comparePassword: (p: string, h: string) => Promise<boolean> };
}

export function createAuthService(deps: AuthServiceDeps = {}) {
  const users = deps.users ?? usersRepo;
  const hasher = deps.hasher ?? { hashPassword, comparePassword };

  async function login({ username, password }: { username: string; password: string }) {
    const row = await users.findUserByUsername(username);
    if (!row) throw new ApiError(401, 'Invalid ID or password');
    const ok = await hasher.comparePassword(password, row.password_hash);
    if (!ok) throw new ApiError(401, 'Invalid ID or password');
    const user = toSafeUser(row as unknown as Record<string, unknown>);
    const token = signToken(user!);
    return { user, token };
  }

  async function getMe(id: number) {
    const row = await users.findUserById(id);
    if (!row) throw new ApiError(401, 'Session user not found');
    return toSafeUser(row as unknown as Record<string, unknown>);
  }

  async function createFaculty({ username, password, name }: { username: string; password: string; name?: string }) {
    const existing = await users.findUserByUsername(username);
    if (existing) throw new ApiError(409, 'Username already exists');
    const password_hash = await hasher.hashPassword(password);
    try {
      const row = await users.createUser({ role: 'faculty', username, password_hash, name: name ?? null });
      return toSafeUser(row as unknown as Record<string, unknown>);
    } catch (e) {
      const err = e as { code?: string };
      if (err && err.code === '23505') throw new ApiError(409, 'Username already exists');
      throw e;
    }
  }

  return { login, getMe, createFaculty };
}

export default createAuthService();
