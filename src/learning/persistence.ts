import { loadConfig } from '../config.js';
import { Pool } from 'pg';
import { Language, AssessmentKind, publicQuestions, scoreAssessment, ScoreResult } from '../assessment.js';
import { assessmentFeedback } from '../ai.js';

const config = loadConfig();

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export interface LearnerProfile {
  dailyMinutes: number;
  correctionStyle: string;
  privacyMode: string;
  accessibilityPrefs: Record<string, unknown>;
}

export async function getProfile(userId: string): Promise<LearnerProfile> {
  const { rows } = await getPool().query(
    `SELECT daily_minutes, correction_style, privacy_mode, accessibility_prefs FROM learner_profiles WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) return { dailyMinutes: 35, correctionStyle: 'balanced', privacyMode: 'standard', accessibilityPrefs: {} };
  const row = rows[0];
  return {
    dailyMinutes: row.daily_minutes,
    correctionStyle: row.correction_style,
    privacyMode: row.privacy_mode,
    accessibilityPrefs: row.accessibility_prefs || {}
  };
}

export async function upsertProfile(userId: string, patch: Partial<LearnerProfile>): Promise<LearnerProfile> {
  const current = await getProfile(userId);
  const next = { ...current, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
  if (next.dailyMinutes < 5 || next.dailyMinutes > 240) throw Object.assign(new Error('dailyMinutes must be 5-240'), { statusCode: 422 });
  await getPool().query(
    `INSERT INTO learner_profiles (user_id, daily_minutes, correction_style, privacy_mode, accessibility_prefs)
     VALUES ($1,$2,$3,$4,$5::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET daily_minutes=EXCLUDED.daily_minutes, correction_style=EXCLUDED.correction_style, privacy_mode=EXCLUDED.privacy_mode, accessibility_prefs=EXCLUDED.accessibility_prefs, updated_at=now()`,
    [userId, next.dailyMinutes, next.correctionStyle, next.privacyMode, JSON.stringify(next.accessibilityPrefs)]
  );
  return next;
}

export interface AssessmentRun {
  assessmentId: string;
  language: Language;
  kind: AssessmentKind;
  status: string;
  questions: ReturnType<typeof publicQuestions>;
  startedAt: string;
}

export async function startAssessment(tenantId: string, languageProfileId: string, language: Language, kind: AssessmentKind): Promise<AssessmentRun> {
  const { rows } = await getPool().query(
    `INSERT INTO assessment_runs (tenant_id, language_profile_id, definition_id, status)
     VALUES ($1,$2,NULL,'in_progress') RETURNING id, started_at`,
    [tenantId, languageProfileId]
  );
  const runId = rows[0].id as string;
  return {
    assessmentId: runId,
    language,
    kind,
    status: 'in_progress',
    questions: publicQuestions(language),
    startedAt: new Date(rows[0].started_at as Date).toISOString()
  };
}

export async function saveAssessmentAttempt(runId: string, clientAttemptId: string, itemId: string, response: unknown): Promise<void> {
  await getPool().query(
    `INSERT INTO assessment_attempts (run_id, item_id, client_attempt_id, response_json)
     VALUES ($1,NULL,$2,$3::jsonb)
     ON CONFLICT (run_id, client_attempt_id) DO UPDATE SET response_json=EXCLUDED.response_json`,
    [runId, clientAttemptId, JSON.stringify({ itemId, response })]
  );
}

export async function getAssessmentRun(runId: string, language: Language, kind: AssessmentKind): Promise<AssessmentRun | null> {
  const { rows } = await getPool().query(
    `SELECT id, status, started_at FROM assessment_runs WHERE id = $1 AND status = 'in_progress'`,
    [runId]
  );
  if (rows.length === 0) return null;
  return {
    assessmentId: runId,
    language,
    kind,
    status: rows[0].status,
    questions: publicQuestions(language),
    startedAt: new Date(rows[0].started_at as Date).toISOString()
  };
}

export async function submitAssessment(
  runId: string,
  tenantId: string,
  userId: string,
  language: Language,
  kind: AssessmentKind,
  goal: string,
  answers: { id: string; answer: number | string }[]
): Promise<ScoreResult & { plan: unknown; provider: string }> {
  const result = scoreAssessment(language, answers);
  const plan = await assessmentFeedback(result, language, kind, goal);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE assessment_runs SET status='finalized', submitted_at=now(), result_json=$2::jsonb, result_version=1
       WHERE id = $1 AND status = 'in_progress'`,
      [runId, JSON.stringify({ ...result, plan: { summary: plan.summary, requirements: plan.requirements, nextCheckpoint: plan.nextCheckpoint, promotionRule: plan.promotionRule } })]
    );
    // persist language profile baseline
    await client.query(
      `INSERT INTO language_profiles (tenant_id, user_id, language, current_level, baseline_status, allocation_pct)
       SELECT $1,$2,$3,$4,'preliminary',100
       WHERE NOT EXISTS (SELECT 1 FROM language_profiles WHERE tenant_id=$1 AND user_id=$2 AND language=$3)`,
      [tenantId, userId, language === 'zh' ? 'zh-CN' : 'en', result.estimatedLevel]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return { ...result, plan, provider: plan.provider };
}

export async function languageProfileId(tenantId: string, userId: string, language: Language): Promise<string> {
  const { rows } = await getPool().query(
    `SELECT id FROM language_profiles WHERE tenant_id = $1 AND user_id = $2 AND language = $3`,
    [tenantId, userId, language === 'zh' ? 'zh-CN' : 'en']
  );
  if (rows.length === 0) {
    const inserted = await getPool().query(
      `INSERT INTO language_profiles (tenant_id, user_id, language) VALUES ($1,$2,$3) RETURNING id`,
      [tenantId, userId, language === 'zh' ? 'zh-CN' : 'en']
    );
    return inserted.rows[0].id as string;
  }
  return rows[0].id as string;
}
