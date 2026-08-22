import { loadConfig } from '../config.js';
import { hashPassword, verifyPassword, hashToken, newSessionToken, newCsrfToken, SessionPayload, Role, isValidEmail, isValidPassword, isValidLocale, SESSION_COOKIE } from './crypto.js';
import { Pool } from 'pg';

const config = loadConfig();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hasPool(): boolean {
  return Boolean(config.databaseUrl);
}

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export class AuthUnavailableError extends Error {
  statusCode: number;
  constructor(message = 'Authentication requires a database (DATABASE_URL)') {
    super(message);
    this.statusCode = 503;
  }
}

function requireDb() {
  if (!hasPool()) throw new AuthUnavailableError();
}

export interface RegisterInput {
  email: string;
  password: string;
  locale: string;
  timezone: string;
  acceptedTermsVersion: string;
}

export interface SessionRecord {
  token: string;
  expiresAt: Date;
  csrfToken: string;
}

export async function register(input: RegisterInput): Promise<{ userId: string; session: SessionRecord; roles: Role[] }> {
  requireDb();
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) throw Object.assign(new Error('email is required'), { statusCode: 422 });
  if (!isValidPassword(input.password)) throw Object.assign(new Error('password must be 12-128 chars'), { statusCode: 422 });
  if (!isValidLocale(input.locale)) throw Object.assign(new Error('locale must be vi, en or zh-CN'), { statusCode: 422 });
  if (!input.timezone || input.timezone.length > 100) throw Object.assign(new Error('timezone is required'), { statusCode: 422 });
  if (!input.acceptedTermsVersion || input.acceptedTermsVersion.length > 50) throw Object.assign(new Error('acceptedTermsVersion is required'), { statusCode: 422 });
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO users (primary_email, locale, timezone)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [email, input.locale, input.timezone]
    );
    const userId = rows[0].id as string;
    await client.query(
      `INSERT INTO auth_identities (user_id, provider, subject, credential_meta)
       VALUES ($1,'password',$2,$3::jsonb)`,
      [userId, email, JSON.stringify({ passwordHash: hashPassword(input.password) })]
    );
    const { rows: tenantRows } = await client.query(
      `INSERT INTO tenants (kind, name) VALUES ('personal', $1) RETURNING id`,
      [email]
    );
    const tenantId = tenantRows[0].id as string;
    await client.query(
      `INSERT INTO memberships (tenant_id, user_id, role) VALUES ($1,$2,'learner')`,
      [tenantId, userId]
    );
    await client.query('COMMIT');
    const session = await createSessionRecord(client, userId, tenantId);
    return { userId, session, roles: ['learner'] };
  } catch (error) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(error)) throw Object.assign(new Error('email is already registered'), { statusCode: 409 });
    throw error;
  } finally {
    client.release();
  }
}

async function createSessionRecord(db: Pool | { query: (text: string, params?: unknown[]) => Promise<unknown> }, userId: string, tenantId: string): Promise<SessionRecord> {
  const token = newSessionToken();
  const csrfToken = newCsrfToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.query(
    `INSERT INTO user_sessions (user_id, tenant_id, token_hash, expires_at, device_meta)
     VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [userId, tenantId, hashToken(token), expiresAt, JSON.stringify({ csrfToken })]
  );
  return { token, expiresAt, csrfToken };
}

export async function login(emailInput: string, password: string): Promise<{ userId: string; session: SessionRecord; roles: Role[] }> {
  requireDb();
  const email = emailInput.trim().toLowerCase();
  const { rows } = await getPool().query(
    `SELECT u.id, i.credential_meta, m.role, t.id AS tenant_id
     FROM users u
     JOIN auth_identities i ON i.user_id = u.id AND i.provider = 'password'
     JOIN memberships m ON m.user_id = u.id
     JOIN tenants t ON t.id = m.tenant_id
     WHERE lower(u.primary_email) = $1`,
    [email]
  );
  const record = rows[0] as { id: string; credential_meta: { passwordHash?: string }; role: Role; tenant_id: string } | undefined;
  if (!record) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  const storedHash = record.credential_meta?.passwordHash;
  if (!storedHash || !verifyPassword(password, storedHash)) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  const session = await createSessionRecord(getPool(), record.id, record.tenant_id);
  return { userId: record.id, session, roles: [record.role] };
}

export async function getSession(token: string | null): Promise<SessionPayload> {
  if (!token) return { authenticated: false, userId: null, expiresAt: null, csrfToken: null, roles: [], scopes: [] };
  requireDb();
  const { rows } = await getPool().query(
    `SELECT s.user_id, s.expires_at, s.revoked_at, s.device_meta, m.role
     FROM user_sessions s
     JOIN memberships m ON m.tenant_id = s.tenant_id AND m.user_id = s.user_id
     WHERE s.token_hash = $1`,
    [hashToken(token)]
  );
  const record = rows[0] as { user_id: string; expires_at: Date; revoked_at: Date | null; device_meta: { csrfToken?: string }; role: Role } | undefined;
  if (!record || record.revoked_at || new Date(record.expires_at) < new Date()) {
    return { authenticated: false, userId: null, expiresAt: null, csrfToken: null, roles: [], scopes: [] };
  }
  const csrfToken = record.device_meta?.csrfToken || null;
  const roles = [record.role];
  return {
    authenticated: true,
    userId: record.user_id,
    expiresAt: new Date(record.expires_at).toISOString(),
    csrfToken,
    roles,
    scopes: scopesForRole(record.role)
  };
}

export async function revokeSession(token: string | null): Promise<void> {
  if (!token) return;
  requireDb();
  await getPool().query(
    `UPDATE user_sessions SET revoked_at = now() WHERE token_hash = $1`,
    [hashToken(token)]
  );
}

export async function revokeAllSessions(userId: string): Promise<void> {
  requireDb();
  await getPool().query(`UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
}

export async function confirmPasswordRecovery(token: string, newPassword: string): Promise<{ changed: true }> {
  requireDb();
  const { rows } = await getPool().query(
    `SELECT s.user_id FROM user_sessions s
     WHERE s.token_hash = $1 AND s.device_meta->>'recovery' = 'true' AND s.revoked_at IS NULL AND s.expires_at > now()`,
    [hashToken(token)]
  );
  const userId = (rows[0] as { user_id: string } | undefined)?.user_id;
  if (!userId) throw Object.assign(new Error('Recovery token invalid or expired'), { statusCode: 409 });
  await getPool().query(
    `UPDATE auth_identities SET credential_meta = jsonb_set(credential_meta, '{passwordHash}', $2::jsonb)
     WHERE user_id = $1 AND provider = 'password'`,
    [userId, JSON.stringify(hashPassword(newPassword))]
  );
  await getPool().query(`UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
  return { changed: true };
}

export async function requestPasswordRecovery(emailInput: string): Promise<{ accepted: true }> {
  requireDb();
  const email = emailInput.trim().toLowerCase();
  if (!isValidEmail(email)) throw Object.assign(new Error('email is required'), { statusCode: 422 });
  const { rows } = await getPool().query(`SELECT id FROM users WHERE lower(primary_email) = $1`, [email]);
  if (rows.length === 0) return { accepted: true }; // do not reveal account existence
  const userId = (rows[0] as { id: string }).id;
  const token = newSessionToken();
  const { rows: tenantRows } = await getPool().query(
    `SELECT tenant_id FROM memberships WHERE user_id = $1 AND role = 'learner' LIMIT 1`,
    [userId]
  );
  const tenantId = (tenantRows[0] as { tenant_id: string } | undefined)?.tenant_id;
  if (!tenantId) return { accepted: true };
  await getPool().query(
    `INSERT INTO user_sessions (user_id, tenant_id, token_hash, expires_at, device_meta)
     VALUES ($1,$2,$3, now() + interval '30 minutes', $4::jsonb)`,
    [userId, tenantId, hashToken(token), JSON.stringify({ recovery: true })]
  );
  // In a full deployment the raw token is delivered via email. This prototype returns it once.
  return { accepted: true };
}

export function parseSessionCookie(header: string | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name === SESSION_COOKIE) return value;
  }
  return null;
}

export function scopesForRole(role: Role): string[] {
  const base: Record<Role, string[]> = {
    learner: ['learning:self', 'support:self', 'billing:self'],
    content_editor: ['learning:self', 'support:self', 'billing:self', 'content:read', 'content:write'],
    learning_reviewer: ['learning:self', 'support:self', 'billing:self', 'content:read', 'content:publish'],
    support: ['learning:self', 'support:self', 'billing:self', 'support:read', 'support:write'],
    moderator: ['learning:self', 'support:self', 'billing:self', 'moderation:read', 'moderation:write'],
    billing_admin: ['learning:self', 'support:self', 'billing:self', 'billing:read', 'billing:write'],
    auditor: ['learning:self', 'support:self', 'billing:self', 'audit:read'],
    admin: ['learning:self', 'support:self', 'billing:self', 'content:read', 'content:write', 'content:publish', 'moderation:read', 'moderation:write', 'support:read', 'support:write', 'billing:read', 'billing:write', 'audit:read']
  };
  return base[role];
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}
