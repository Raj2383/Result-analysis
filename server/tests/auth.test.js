import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { createAuthService, toSafeUser } from '../src/services/auth.service';

const FACULTY_ROW = {
  id: 2,
  role: 'faculty',
  username: 'prof01',
  password_hash: 'stored-hash',
  name: 'Prof One',
  email: null,
};

function makeDeps(overrides = {}) {
  return {
    users: {
      findUserByUsername: vi.fn(async () => null),
      findUserById: vi.fn(async () => null),
      createUser: vi.fn(async (input) => ({ id: 3, ...input })),
      ...overrides.users,
    },
    hasher: {
      hashPassword: vi.fn(async () => 'hashed-pw'),
      comparePassword: vi.fn(async () => true),
      ...overrides.hasher,
    },
  };
}

describe('auth.service login', () => {
  it('returns safe user (no hash) + verifiable JWT on success', async () => {
    const deps = makeDeps({
      users: { findUserByUsername: vi.fn(async () => FACULTY_ROW) },
    });
    const svc = createAuthService(deps);

    const { user, token } = await svc.login({ username: 'prof01', password: 'secret123' });

    expect(user).toEqual({ id: 2, role: 'faculty', username: 'prof01', name: 'Prof One', email: null });
    expect(user).not.toHaveProperty('password_hash');
    expect(jwt.decode(token)).toMatchObject({ sub: 2, role: 'faculty' });
  });

  it('401 for unknown username (same message as wrong password)', async () => {
    const svc = createAuthService(makeDeps());
    await expect(svc.login({ username: 'nope', password: 'x' })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid ID or password',
    });
  });

  it('401 for wrong password', async () => {
    const deps = makeDeps({
      users: { findUserByUsername: vi.fn(async () => FACULTY_ROW) },
      hasher: { comparePassword: vi.fn(async () => false) },
    });
    const svc = createAuthService(deps);
    await expect(svc.login({ username: 'prof01', password: 'wrong' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe('auth.service getMe', () => {
  it('returns safe user', async () => {
    const deps = makeDeps({ users: { findUserById: vi.fn(async () => FACULTY_ROW) } });
    await expect(createAuthService(deps).getMe(2)).resolves.toMatchObject({ username: 'prof01' });
  });

  it('401 when session user no longer exists', async () => {
    await expect(createAuthService(makeDeps()).getMe(99)).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('auth.service createFaculty', () => {
  it('forces faculty role and returns safe user', async () => {
    const deps = makeDeps();
    const user = await createAuthService(deps).createFaculty({ username: 'prof02', password: 'secret123' });

    expect(deps.users.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'faculty', username: 'prof02' })
    );
    expect(user.role).toBe('faculty');
  });

  it('409 on duplicate username (pre-check, no insert attempted)', async () => {
    const deps = makeDeps({ users: { findUserByUsername: vi.fn(async () => FACULTY_ROW) } });
    await expect(
      createAuthService(deps).createFaculty({ username: 'prof01', password: 'secret123' })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(deps.users.createUser).not.toHaveBeenCalled();
  });

  it('409 on race-condition unique violation (23505)', async () => {
    const deps = makeDeps({ users: { createUser: vi.fn(async () => { throw { code: '23505' }; }) } });
    await expect(
      createAuthService(deps).createFaculty({ username: 'prof02', password: 'secret123' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('toSafeUser', () => {
  it('strips password_hash and nulls missing fields', () => {
    expect(toSafeUser(FACULTY_ROW)).not.toHaveProperty('password_hash');
    expect(toSafeUser(null)).toBeNull();
  });
});
