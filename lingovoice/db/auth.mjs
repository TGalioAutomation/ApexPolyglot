// LingoVoice — Xác thực tài khoản người học (ADR-002)
// Password: scrypt (node:crypto) + salt riêng mỗi user. Session: token ngẫu nhiên,
// DB chỉ lưu SHA-256(token) → rò rỉ DB không lộ token, thu hồi được từng phiên.
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
export const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE = 'lv_session';

export function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(String(password), salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const derived = scryptSync(String(password), salt, expected.length, { N: +N, r: +r, p: +p });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function passwordStrengthOk(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

export function sessionExpiry(days = SESSION_TTL_DAYS) {
  return new Date(Date.now() + days * 86400_000);
}

// Cookie HttpOnly SameSite=Lax — không cần Secure ở loopback; reverse proxy HTTPS sẽ thêm
export function sessionCookie(token, { maxAgeSeconds = SESSION_TTL_DAYS * 86400 } = {}) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function parseSessionCookie(request) {
  const header = request.headers.cookie || '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=');
  }
  return null;
}

// Trả user hoặc null; đồng thời dọn session hết hạn
export async function resolveSession(store, request) {
  if (!store) return null;
  const token = parseSessionCookie(request);
  if (!token) return null;
  const session = await store.findSessionByToken(tokenHash(token));
  if (!session) return null;
  const user = await store.findUserById(session.user_id);
  return user ? { user, session } : null;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name || user.displayName || '',
    role: user.role,
    ageGroup: user.age_group || user.ageGroup || 'young-adult'
  };
}
