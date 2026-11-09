/** Shared constants – no secrets here. */
export const ROLES = { FACULTY: 'faculty', ADMIN: 'admin' } as const;
export const EXAM_TYPES = { REGULAR: 'REGULAR', REAPPEAR: 'REAPPEAR' } as const;
export const COOKIE_NAME: string = process.env.JWT_COOKIE_NAME || 'access_token';
export const DEFAULTS = Object.freeze({
  SEMESTER: 5,
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
});
