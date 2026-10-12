import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { generateLessonContent, LessonType, Language } from './content.js';

const { Pool } = pg;

interface CurriculumJson {
  durationDays: number;
  dailyMinutes: number;
  target?: string;
  dailyRoutine: { minutes: number; skill: string; activity: string }[];
  phases: { days: string; name: string; focus: string; checkpoint: string }[];
  weeklyRotation: string[];
}

function loadCurriculum(): CurriculumJson {
  const url = fileURLToPath(new URL('../../curriculum.json', import.meta.url));
  return JSON.parse(readFileSync(url, 'utf8')) as CurriculumJson;
}

const LESSON_TYPES = ['listening', 'reading', 'speaking', 'review'] as const;

function contentHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }> };

export async function seedCurriculum(databaseUrl: string): Promise<{ course: string; version: number; units: number; lessons: number }> {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const curriculum = loadCurriculum();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const courses: Language[] = ['en', 'zh-CN'];
      const seedResult = { course: '', version: 0, units: 0, lessons: 0 };
      for (const lang of courses) {
      let courseId = (await client.query(`SELECT id FROM courses WHERE code = $1`, [`curriculum-${lang}-90`])).rows[0]?.id as string | undefined;
      if (!courseId) {
        const inserted = await client.query(`INSERT INTO courses (language, code, status) VALUES ($1,$2,'published') RETURNING id`, [lang, `curriculum-${lang}-90`]);
        courseId = inserted.rows[0].id as string;
      }
      const hash = contentHash(JSON.stringify(curriculum));
        const existingVersion = (await client.query(
          `SELECT id, version FROM course_versions WHERE course_id = $1 AND content_hash = $2`,
          [courseId, hash]
        )).rows[0] as { id: string; version: number } | undefined;
        if (existingVersion) {
          seedResult.course = courseId;
          seedResult.version = existingVersion.version;
          continue;
        }
        const maxVersion = (await client.query(`SELECT COALESCE(MAX(version),0) AS v FROM course_versions WHERE course_id = $1`, [courseId])).rows[0].v as number;
        const version = maxVersion + 1;
        const versionInserted = await client.query(
          `INSERT INTO course_versions (course_id, version, status, published_at, content_hash) VALUES ($1,$2,'published',now(),$3) RETURNING id`,
          [courseId, version, hash]
        );
        const versionId = versionInserted.rows[0].id as string;

        // Seed skills graph
        await ensureSkills(client, lang);

        let unitsCreated = 0;
        let lessonsCreated = 0;
        for (let day = 1; day <= curriculum.durationDays; day += 1) {
          const unitInserted = await client.query(
            `INSERT INTO units (course_version_id, sequence, level, outcomes_json) VALUES ($1,$2,$3,$4::jsonb) RETURNING id`,
            [versionId, day, levelForDay(day), JSON.stringify({ day, durationDays: curriculum.durationDays, dailyMinutes: curriculum.dailyMinutes })]
          );
          const unitId = unitInserted.rows[0].id as string;
          unitsCreated += 1;
          for (const [index, lessonType] of LESSON_TYPES.entries()) {
            const content = generateLessonContent(lang, day, lessonType as LessonType);
            await client.query(
              `INSERT INTO lessons (unit_id, sequence, type, estimated_minutes, schema_version, content_json)
               VALUES ($1,$2,$3,$4,1,$5::jsonb)`,
              [unitId, index + 1, lessonType, content.minutes, JSON.stringify(content)]
            );
            lessonsCreated += 1;
          }
        }
        seedResult.course = courseId;
        seedResult.version = version;
        seedResult.units += unitsCreated;
        seedResult.lessons += lessonsCreated;
      }
      await client.query('COMMIT');
      return { course: seedResult.course, version: seedResult.version, units: seedResult.units, lessons: seedResult.lessons };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

async function ensureSkills(client: Queryable, language: 'en' | 'zh-CN'): Promise<void> {
  const skills: { code: string; modality: 'listening' | 'reading' | 'speaking' | 'vocabulary' | 'grammar' }[] = [
    { code: 'listening', modality: 'listening' },
    { code: 'reading', modality: 'reading' },
    { code: 'speaking', modality: 'speaking' },
    { code: 'vocabulary', modality: 'vocabulary' },
    { code: 'grammar', modality: 'grammar' }
  ];
  for (const skill of skills) {
    await client.query(
      `INSERT INTO skills (language, code, modality) VALUES ($1,$2,$3)
       ON CONFLICT (language, code) DO NOTHING`,
      [language, skill.code, skill.modality]
    );
  }
}

function levelForDay(day: number): number {
  if (day <= 30) return 1;
  if (day <= 60) return 2;
  return 3;
}

export interface TodayPlanItem {
  lessonId: string;
  sequence: number;
  type: string;
  estimatedMinutes: number;
  content: Record<string, unknown>;
}

export async function getTodayPlan(databaseUrl: string, language: string, day: number): Promise<TodayPlanItem[] | null> {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query(
      `SELECT l.id AS lesson_id, l.sequence, l.type, l.estimated_minutes, l.content_json
       FROM lessons l
       JOIN units u ON u.id = l.unit_id
       JOIN course_versions cv ON cv.id = u.course_version_id
       JOIN courses c ON c.id = cv.course_id
       WHERE c.language = $1 AND cv.status = 'published' AND u.sequence = $2
         AND cv.published_at = (SELECT MAX(published_at) FROM course_versions WHERE course_id = c.id AND status = 'published')
       ORDER BY l.sequence`,
      [language, day]
    );
    if (rows.length === 0) return null;
    return rows.map((row) => ({
      lessonId: row.lesson_id,
      sequence: row.sequence,
      type: row.type,
      estimatedMinutes: row.estimated_minutes,
      content: row.content_json
    }));
  } finally {
    await pool.end();
  }
}
