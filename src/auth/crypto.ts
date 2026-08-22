import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export type Role = 'learner' | 'content_editor' | 'learning_reviewer' | 'support' | 'moderator' | 'billing_admin' | 'auditor' | 'admin';

export const ROLES: Role[] = ['learner', 'content_editor', 'learning_reviewer', 'support', 'moderator', 'billing_admin', 'auditor', 'admin'];

export interface SessionPayload {
  authenticated: boolean;
  userId: string | null;
  expiresAt: string | null;
  csrfToken: string | null;
  roles: Role[];
  scopes: string[];
}

export const SESSION_COOKIE = '__Host-lingopilot_session';
export const CSRF_HEADER = 'x-csrf-token';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

export function isValidPassword(password: unknown, min = 12): password is string {
  return typeof password === 'string' && password.length >= min && password.length <= 128;
}

export function isValidLocale(locale: unknown): locale is string {
  return ['vi', 'en', 'zh-CN'].includes(locale as string);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newCsrfToken(): string {
  return randomBytes(24).toString('base64url');
}

export function validateRecoveryToken(token: unknown): token is string {
  return typeof token === 'string' && token.length >= 32 && token.length <= 2048;
}

export function csrfMatches(expected: string | null | undefined, provided: string | null | undefined): boolean {
  if (!expected || !provided) return false;
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
