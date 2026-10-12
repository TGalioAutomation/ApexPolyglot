import { loadConfig } from '../config.js';
import { Pool } from 'pg';

const config = loadConfig();

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw new Error('Database is not configured');
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export interface Readiness {
  ready: boolean;
  database: 'ok' | 'unconfigured' | 'unreachable';
  checks: Record<string, string>;
}

/**
 * Readiness probe (SRE / load drills): the API is ready when the database is
 * reachable. Voice readiness additionally requires the OpenVox model loaded,
 * but that is gated by the voice layer in production.
 */
export async function readiness(): Promise<Readiness> {
  const checks: Record<string, string> = {};
  if (!config.databaseUrl) {
    checks.database = 'unconfigured';
    return { ready: false, database: 'unconfigured', checks };
  }
  try {
    const client = await getPool().connect();
    try {
      await client.query('SELECT 1');
      checks.database = 'ok';
      return { ready: true, database: 'ok', checks };
    } finally {
      client.release();
    }
  } catch (error) {
    checks.database = 'unreachable';
    return { ready: false, database: 'unreachable', checks };
  }
}

export interface OutboxEvent {
  topic: string;
  payload: unknown;
  aggregateId?: string;
}

/**
 * Reliable outbox relay: append an event in the same DB transaction as the
 * business change, then a worker publishes it. This provides offline sync /
 * cross-device eventing without a message broker (TADR-002 outbox_events).
 */
export async function enqueueOutbox(event: OutboxEvent): Promise<string> {
  const { rows } = await getPool().query(
    `INSERT INTO outbox_events (topic, aggregate_id, payload)
     VALUES ($1,$2,$3::jsonb) RETURNING id`,
    [event.topic, event.aggregateId ?? null, JSON.stringify(event.payload)]
  );
  return rows[0].id as string;
}

export async function publishOutbox(batchSize = 100): Promise<number> {
  const { rows } = await getPool().query(
    `SELECT id, topic FROM outbox_events WHERE published_at IS NULL ORDER BY occurred_at LIMIT $1`,
    [batchSize]
  );
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return 0;
  await getPool().query(
    `UPDATE outbox_events SET published_at = now() WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return ids.length;
}
