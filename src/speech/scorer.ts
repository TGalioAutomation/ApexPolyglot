import { loadConfig } from '../config.js';
import { Pool } from 'pg';

const config = loadConfig();

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

export type Language = 'en' | 'zh-CN';

export interface SpeechAnalysis {
  status: 'preliminary' | 'analyzed' | 'failed';
  score?: number;
  transcript: string;
  asrConfidence: number | null;
  pronunciationScore?: number;
  toneScore?: number;
  fluencyScore?: number;
  dimensions: string[];
  caveat?: string;
}

export interface ScoreRequest {
  attemptId: string;
  sessionId: string;
  language: Language;
  transcript: string;
  mediaObjectId?: string;
  targetText: string;
}

/**
 * TADR-006: AI/speech is not the scoring authority. A transcript-only score is
 * always marked `preliminary`; pronunciation/tone only exist when the audio
 * analysis adapter reports sufficient confidence.
 *
 * This is a deterministic placeholder scorer that the production build replaces
 * with a phoneme/tone analyzer behind the same interface (per architecture 11.4).
 */
export async function analyzeSpeech(request: ScoreRequest): Promise<SpeechAnalysis> {
  const score = textSimilarity(request.transcript, request.targetText);
  // Without a real audio analyzer we cannot claim pronunciation/tone.
  return {
    status: 'preliminary',
    score,
    transcript: request.transcript,
    asrConfidence: null,
    dimensions: ['comprehensibility'],
    caveat: 'Điểm dựa trên transcript; chưa đo phát âm hoặc thanh điệu vì thiếu audio analyzer.'
  };
}

/**
 * Persist a speech attempt. Always marks transcript-only results `preliminary`
 * so downstream code never treats them as verified pronunciation/tone.
 */
export async function saveSpeechAttempt(request: ScoreRequest, analysis: SpeechAnalysis): Promise<void> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO attempts (session_id, client_attempt_id, response_json, status)
     SELECT $1, $2, '{"source":"speech"}'::jsonb, 'graded'
     WHERE EXISTS (SELECT 1 FROM learning_sessions WHERE id = $1)
     RETURNING id`,
    [request.sessionId ?? null, request.attemptId]
  );
  if (rows.length === 0) {
    throw Object.assign(new Error('session not found'), { statusCode: 404 });
  }
  const attemptId = rows[0].id as string;
  await pool.query(
    `INSERT INTO speech_attempts (attempt_id, media_object_id, transcript, asr_confidence, analysis_json, analysis_version, status)
     VALUES ($1,$2,$3,$4,$5::jsonb,1,$6)
     ON CONFLICT (attempt_id) DO UPDATE
       SET transcript=EXCLUDED.transcript, asr_confidence=EXCLUDED.asr_confidence,
           analysis_json=EXCLUDED.analysis_json, status=EXCLUDED.status`,
    [attemptId, request.mediaObjectId ?? null, request.transcript, analysis.asrConfidence, JSON.stringify(analysis), analysis.status]
  );
}

function textSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  const wordsA = new Set(na.split(' '));
  const wordsB = nb.split(' ');
  const hits = wordsB.filter((word) => wordsA.has(word)).length;
  return Math.round((hits / Math.max(1, wordsB.length)) * 100);
}
