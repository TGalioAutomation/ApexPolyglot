import { loadConfig } from '../config.js';
import { Pool } from 'pg';

const config = loadConfig();
const POLICY_VERSION = 'skill-policy-v1';

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export interface EvidenceInput {
  languageProfileId: string;
  skillCode: string;
  sourceType: string;
  sourceId: string;
  measure: number;
  weight?: number;
}

export interface Mastery {
  skillCode: string;
  recognition: number;
  comprehension: number;
  production: number;
  retention: number;
  confidence: number;
}

/**
 * Append-only evidence ledger (TADR-003). Returns false if this (source, skill)
 * was already recorded for this profile under the active policy.
 */
export async function appendEvidence(input: EvidenceInput): Promise<boolean> {
  const pool = getPool();
  const skill = await skillId(pool, input.languageProfileId, input.skillCode);
  if (!skill) throw Object.assign(new Error(`Unknown skill ${input.skillCode}`), { statusCode: 422 });
  const { rows } = await pool.query(
    `INSERT INTO skill_evidence (language_profile_id, skill_id, source_type, source_id, measure, weight, policy_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (source_type, source_id, skill_id) DO NOTHING
     RETURNING id`,
    [input.languageProfileId, skill.id, input.sourceType, input.sourceId, clamp01(input.measure), input.weight ?? 1, POLICY_VERSION]
  );
  if (rows.length === 0) return false;
  await rebuildMastery(pool, input.languageProfileId, skill);
  return true;
}

export async function getMastery(languageProfileId: string): Promise<Mastery[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT s.code, m.recognition, m.comprehension, m.production, m.retention, m.confidence
     FROM skill_mastery m JOIN skills s ON s.id = m.skill_id
     WHERE m.language_profile_id = $1 ORDER BY s.code`,
    [languageProfileId]
  );
  if (rows.length > 0) {
    return rows.map((row) => ({
      skillCode: row.code,
      recognition: Number(row.recognition),
      comprehension: Number(row.comprehension),
      production: Number(row.production),
      retention: Number(row.retention),
      confidence: Number(row.confidence)
    }));
  }
  // not yet projected: derive from raw evidence
  const raw = await pool.query(
    `SELECT s.code, e.measure, e.weight
     FROM skill_evidence e JOIN skills s ON s.id = e.skill_id
     WHERE e.language_profile_id = $1`,
    [languageProfileId]
  );
  const bySkill = new Map<string, { sum: number; weight: number }>();
  for (const row of raw.rows as { code: string; measure: number; weight: number }[]) {
    const measure = Number(row.measure);
    const weight = Number(row.weight);
    const acc = bySkill.get(row.code) || { sum: 0, weight: 0 };
    acc.sum += measure * weight;
    acc.weight += weight;
    bySkill.set(row.code, acc);
  }
  return [...bySkill.entries()].map(([skillCode, acc]) => ({
    skillCode,
    recognition: clamp01(acc.weight ? acc.sum / acc.weight : 0),
    comprehension: clamp01(acc.weight ? acc.sum / acc.weight : 0),
    production: clamp01(acc.weight ? acc.sum / acc.weight : 0),
    retention: 0,
    confidence: Math.min(1, acc.weight / 3)
  }));
}

async function skillId(pool: Pool, languageProfileId: string, skillCode: string): Promise<{ id: string } | null> {
  const profile = (await pool.query(`SELECT language FROM language_profiles WHERE id = $1`, [languageProfileId])).rows[0] as { language?: string } | undefined;
  const language = profile?.language === 'zh-CN' ? 'zh-CN' : 'en';
  const { rows } = await pool.query(`SELECT id FROM skills WHERE language = $1 AND code = $2`, [language, skillCode]);
  return rows[0] as { id: string } | undefined ?? null;
}

/**
 * Recompute the mastery projection for a profile+skill from the evidence ledger.
 * Deterministic, versioned projection (TADR-003).
 */
async function rebuildMastery(pool: Pool, languageProfileId: string, skill: { id: string }): Promise<void> {
  const { rows } = await pool.query(
    `SELECT measure, weight FROM skill_evidence WHERE language_profile_id = $1 AND skill_id = $2`,
    [languageProfileId, skill.id]
  );
  let sum = 0;
  let weightSum = 0;
  for (const row of rows as { measure: number; weight: number }[]) {
    const measure = Number(row.measure);
    const weight = Number(row.weight);
    sum += measure * weight;
    weightSum += weight;
  }
  const value = clamp01(weightSum ? sum / weightSum : 0);
  const confidence = clamp01(weightSum / 3);
  await pool.query(
    `INSERT INTO skill_mastery (language_profile_id, skill_id, recognition, comprehension, production, retention, confidence, updated_at)
     VALUES ($1,$2,$3,$3,$3,0,$4,now())
     ON CONFLICT (language_profile_id, skill_id)
     DO UPDATE SET recognition=EXCLUDED.recognition, comprehension=EXCLUDED.comprehension,
       production=EXCLUDED.production, confidence=EXCLUDED.confidence, updated_at=now()`,
    [languageProfileId, skill.id, value, confidence]
  );
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
