import { loadConfig } from '../config.js';
import { Pool } from 'pg';

const config = loadConfig();

export type ConsentType = 'audio_record' | 'audio_retention' | 'analytics' | 'ai_personalization';
const CONSENT_TYPES: ConsentType[] = ['audio_record', 'audio_retention', 'analytics', 'ai_personalization'];

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export interface ConsentRecord {
  type: ConsentType;
  policyVersion: string;
  granted: boolean;
  decidedAt: string;
}

export interface ConsentState {
  tenantId: string;
  userId: string;
  consents: ConsentRecord[];
}

export function isValidConsentType(type: unknown): type is ConsentType {
  return typeof type === 'string' && (CONSENT_TYPES as string[]).includes(type);
}

export async function recordConsent(tenantId: string, userId: string, type: ConsentType, policyVersion: string, granted: boolean): Promise<ConsentRecord> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO consents (tenant_id, user_id, type, policy_version, granted, decided_at)
     VALUES ($1,$2,$3,$4,$5,now())
     ON CONFLICT (tenant_id, user_id, type, policy_version)
     DO UPDATE SET granted = EXCLUDED.granted, decided_at = now()`,
    [tenantId, userId, type, policyVersion, granted]
  );
  return { type, policyVersion, granted, decidedAt: new Date().toISOString() };
}

export async function getConsents(tenantId: string, userId: string): Promise<ConsentState> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT type, policy_version, granted, decided_at
     FROM consents WHERE tenant_id = $1 AND user_id = $2
     ORDER BY type, policy_version`,
    [tenantId, userId]
  );
  return {
    tenantId,
    userId,
    consents: rows.map((row) => ({
      type: row.type as ConsentType,
      policyVersion: row.policy_version as string,
      granted: row.granted as boolean,
      decidedAt: new Date(row.decided_at as Date).toISOString()
    }))
  };
}
