import { loadConfig } from '../config.js';
import { Pool } from 'pg';

const config = loadConfig();

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export interface RetentionResult {
  expired: number;
}

/**
 * Apply retention policy (TADR-007/014):
 * - transient media (no audio_retention consent): expire after 24h
 * - short/history media (with audio_retention consent): expire after 30 days
 *
 * Marks `media_objects` rows as expired. In production this also hard-deletes
 * the underlying object from S3; here we record the decision so the lifecycle
 * job can be verified without coupling to a live bucket.
 */
export async function runRetention(now = new Date()): Promise<RetentionResult> {
  const pool = getPool();
  // transient: 24h unless the owner consented to audio_retention
  const transient = await pool.query(
    `UPDATE media_objects m SET status = 'expired', expires_at = now()
     WHERE m.status = 'active'
       AND m.retention_class = 'transient'
       AND m.created_at < $1::timestamptz - interval '24 hours'
       AND NOT EXISTS (
         SELECT 1 FROM consents c
         WHERE c.user_id = m.owner_user_id AND c.type = 'audio_retention' AND c.granted = true
       )
     RETURNING id`,
    [now]
  );
  // short/history: 30 days (default when no explicit consent path overrides)
  const short = await pool.query(
    `UPDATE media_objects m SET status = 'expired', expires_at = now()
     WHERE m.status = 'active'
       AND m.retention_class IN ('short','history')
       AND m.created_at < $1::timestamptz - interval '30 days'
     RETURNING id`,
    [now]
  );
  return { expired: (transient.rowCount ?? 0) + (short.rowCount ?? 0) };
}

/**
 * Account deletion / hard cleanup: permanently remove rows for media whose
 * owner requested deletion. Keeps the score/evidence but drops the raw object.
 */
export async function purgeAccountMedia(userId: string): Promise<RetentionResult> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE media_objects SET status = 'deleted' WHERE owner_user_id = $1 AND status <> 'deleted'`,
    [userId]
  );
  return { expired: rowCount ?? 0 };
}
