import { loadConfig } from '../config.js';
import { Pool } from 'pg';

const config = loadConfig();

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export interface LessonContent {
  lessonId: string;
  type: string;
  estimatedMinutes: number;
  content: Record<string, unknown>;
}

export async function getLesson(language: string, day: number, type: string): Promise<LessonContent | null> {
  const { rows } = await getPool().query(
    `SELECT l.id AS lesson_id, l.type, l.estimated_minutes, l.content_json
     FROM lessons l
     JOIN units u ON u.id = l.unit_id
     JOIN course_versions cv ON cv.id = u.course_version_id
     JOIN courses c ON c.id = cv.course_id
     WHERE c.language = $1 AND cv.status = 'published' AND u.sequence = $2 AND l.type = $3
       AND cv.published_at = (SELECT MAX(published_at) FROM course_versions WHERE course_id = c.id AND status = 'published')
     LIMIT 1`,
    [language === 'zh' ? 'zh-CN' : 'en', day, type]
  );
  if (rows.length === 0) return null;
  return { lessonId: rows[0].lesson_id, type: rows[0].type, estimatedMinutes: rows[0].estimated_minutes, content: rows[0].content_json };
}

export async function startSession(tenantId: string, languageProfileId: string, lessonId: string): Promise<string> {
  const { rows } = await getPool().query(
    `INSERT INTO learning_sessions (tenant_id, language_profile_id, lesson_id, status)
     VALUES ($1,$2,$3,'in_progress') RETURNING id`,
    [tenantId, languageProfileId, lessonId]
  );
  return rows[0].id as string;
}

export async function completeSession(sessionId: string, meaningfulSeconds: number): Promise<{ completed: boolean }> {
  const { rows } = await getPool().query(
    `UPDATE learning_sessions
     SET status='completed', completed_at=now(), meaningful_seconds=$2
     WHERE id = $1 AND status = 'in_progress'
     RETURNING language_profile_id, meaningful_seconds`,
    [sessionId, Math.max(0, meaningfulSeconds)]
  );
  if (rows.length === 0) return { completed: false };
  const profileId = rows[0].language_profile_id as string;
  const seconds = Number(rows[0].meaningful_seconds);
  // update daily progress
  await getPool().query(
    `INSERT INTO daily_progress (language_profile_id, local_date, meaningful_seconds, sessions_completed, goal_met)
     VALUES ($1, CURRENT_DATE, $2, 1, $2 >= 600)
     ON CONFLICT (language_profile_id, local_date)
     DO UPDATE SET meaningful_seconds = daily_progress.meaningful_seconds + EXCLUDED.meaningful_seconds,
       sessions_completed = daily_progress.sessions_completed + 1,
       goal_met = (daily_progress.meaningful_seconds + EXCLUDED.meaningful_seconds) >= 600`,
    [profileId, seconds]
  );
  return { completed: true };
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  sessionsCompleted: number;
  meaningfulSeconds: number;
  meaningfulMinutes: number;
  goalMetDays: number;
}

export async function weeklyReport(languageProfileId: string, endDate?: Date): Promise<WeeklyReport> {
  const end = endDate ? endDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const start = new Date(new Date(end).getTime() - 6 * 86400000).toISOString().slice(0, 10);
  const { rows } = await getPool().query(
    `SELECT COALESCE(SUM(meaningful_seconds),0) AS seconds, COALESCE(SUM(sessions_completed),0) AS sessions,
            COUNT(*) FILTER (WHERE goal_met) AS goal_days
     FROM daily_progress
     WHERE language_profile_id = $1 AND local_date BETWEEN $2 AND $3`,
    [languageProfileId, start, end]
  );
  const seconds = Number(rows[0].seconds);
  return {
    weekStart: start,
    weekEnd: end,
    sessionsCompleted: Number(rows[0].sessions),
    meaningfulSeconds: seconds,
    meaningfulMinutes: Math.round(seconds / 60),
    goalMetDays: Number(rows[0].goal_days)
  };
}

export async function nextBestAction(languageProfileId: string, _language: string, day: number): Promise<{ type: string; reason: string }> {
  // adaptive: prioritize the weakest skill from mastery, else today's lesson by weekday rotation
  const mastery = await getPool().query(
    `SELECT s.code, m.production FROM skill_mastery m JOIN skills s ON s.id = m.skill_id
     WHERE m.language_profile_id = $1 ORDER BY m.production ASC NULLS LAST LIMIT 1`,
    [languageProfileId]
  );
  if (mastery.rows.length > 0) {
    const weak = (mastery.rows[0] as { code: string }).code;
    return { type: weak === 'listening' ? 'listening' : weak, reason: `Kỹ năng ${weak} còn yếu, ưu tiên luyện trước.` };
  }
  const rotation = ['listening', 'reading', 'speaking', 'review'];
  const type = rotation[(day - 1) % rotation.length];
  return { type, reason: 'Bắt đầu theo lộ trình hôm nay.' };
}
