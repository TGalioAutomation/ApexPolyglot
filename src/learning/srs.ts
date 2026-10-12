import { loadConfig } from '../config.js';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';

const config = loadConfig();
const ALGORITHM_VERSION = 1;

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

/**
 * SM-2-lite SRS grade -> interval scheduling.
 * grade 0-5; <3 is a fail, >=3 is a pass.
 */
export interface ReviewGrade {
  grade: number;
  occurredAt?: string;
}

export interface ItemState {
  state: 'new' | 'learning' | 'review' | 'mastered';
  stability: number;
  difficulty: number;
  dueAt: string | null;
  lastGrade: number | null;
  revision: number;
}

export function computeNext(difficulty: number, grade: number): { difficulty: number; intervalDays: number } {
  const q = clamp(grade / 5, 0, 1);
  const newDifficulty = clamp(difficulty + 0.1 - 0.15 * q, 0, 1);
  let intervalDays: number;
  if (grade >= 3) {
    intervalDays = grade === 5 ? 30 : grade === 4 ? 10 : 3;
    intervalDays = Math.max(1, Math.round(intervalDays * (1 - newDifficulty * 0.4)));
  } else {
    intervalDays = 0;
  }
  return { difficulty: newDifficulty, intervalDays };
}

export async function ensureItem(languageProfileId: string, language: string, type: string, canonicalText: string, context: Record<string, unknown>): Promise<string> {
  const pool = getPool();
  const contentHash = requireHash(JSON.stringify({ type, canonicalText }));
  await pool.query(
    `INSERT INTO learning_items (language, type, canonical_text, context_json, content_hash)
     VALUES ($1,$2,$3,$4::jsonb,$5)
     ON CONFLICT (content_hash) DO UPDATE SET canonical_text = EXCLUDED.canonical_text`,
    [language, type, canonicalText, JSON.stringify(context), contentHash]
  );
  const { rows } = await pool.query(`SELECT id FROM learning_items WHERE content_hash = $1`, [contentHash]);
  const itemId = rows[0].id as string;
  await pool.query(
    `INSERT INTO user_items (language_profile_id, item_id)
     VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [languageProfileId, itemId]
  );
  return itemId;
}

export async function dueItems(languageProfileId: string, limit = 20): Promise<{ itemId: string; canonicalText: string; type: string }[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT ui.item_id, li.canonical_text, li.type
     FROM user_items ui JOIN learning_items li ON li.id = ui.item_id
     WHERE ui.language_profile_id = $1 AND (ui.due_at IS NULL OR ui.due_at <= now())
       AND ui.state <> 'mastered'
     ORDER BY ui.due_at NULLS FIRST
     LIMIT $2`,
    [languageProfileId, limit]
  );
  return rows.map((row) => ({ itemId: row.item_id, canonicalText: row.canonical_text, type: row.type }));
}

export async function reviewItem(languageProfileId: string, itemId: string, grade: number): Promise<ItemState> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT state, stability, difficulty, due_at, last_grade, revision
     FROM user_items WHERE language_profile_id = $1 AND item_id = $2`,
    [languageProfileId, itemId]
  );
  const current = rows[0] as { state: string; stability: number; difficulty: number; due_at: Date | null; last_grade: number | null; revision: number } | undefined;
  if (!current) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
  const difficulty = Number(current.difficulty);
  const next = computeNext(difficulty, grade);
  const passed = grade >= 3;
  const nextState = !passed ? 'learning' : current.state === 'learning' ? 'review' : 'review';
  const revision = Number(current.revision) + 1;
  const intervalDays = passed && next.intervalDays > 0 ? next.intervalDays : next.intervalDays;
  const dueAt = passed && intervalDays > 0 ? new Date(Date.now() + intervalDays * 86400000) : null;
  await pool.query(
    `UPDATE user_items
     SET state=$1, difficulty=$2, last_grade=$3, revision=$4, due_at=$5
     WHERE language_profile_id=$6 AND item_id=$7`,
    [nextState, next.difficulty, grade, revision, dueAt, languageProfileId, itemId]
  );
  await pool.query(
    `INSERT INTO review_attempts (language_profile_id, item_id, grade, algorithm_version)
     VALUES ($1,$2,$3,$4)`,
    [languageProfileId, itemId, grade, ALGORITHM_VERSION]
  );
  return {
    state: nextState as ItemState['state'],
    stability: Number(current.stability),
    difficulty: next.difficulty,
    dueAt: dueAt ? dueAt.toISOString() : null,
    lastGrade: grade,
    revision
  };
}

function requireHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
