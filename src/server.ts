import { createServer, ServerResponse, IncomingMessage } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { loadConfig, root } from './config.js';
import { publicQuestions, scoreAssessment, AssessmentKind, Language } from './assessment.js';
import { coachReply, lessonReply, assessmentFeedback, configuredProviders, providerOrder } from './ai.js';
import { openvoxSpeech } from './voice.js';
import { register, login, getSession, revokeSession, revokeAllSessions, requestPasswordRecovery, confirmPasswordRecovery, parseSessionCookie, SessionRecord } from './auth/service.js';
import { SESSION_COOKIE, CSRF_HEADER, csrfMatches, validateRecoveryToken } from './auth/crypto.js';
import { getTodayPlan } from './curriculum/service.js';
import { requestLog } from './observability/logger.js';
import { recordConsent, getConsents, isValidConsentType } from './consent/service.js';
import { getProfile, upsertProfile, startAssessment, saveAssessmentAttempt, getAssessmentRun, submitAssessment, languageProfileId } from './learning/persistence.js';
import { appendEvidence, getMastery } from './learning/evidence.js';
import { ensureItem, dueItems, reviewItem } from './learning/srs.js';
import { getLesson, startSession, completeSession, weeklyReport, nextBestAction } from './learning/player.js';
import { createUploadIntent } from './media/service.js';
import { analyzeSpeech, saveSpeechAttempt } from './speech/scorer.js';
import { attachVoiceGateway } from './voice/gateway.js';
import { runRetention } from './media/retention.js';
import { readiness, enqueueOutbox, publishOutbox } from './operations/scale.js';

const config = loadConfig();
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const publicFiles = new Set(['/index.html', '/styles.css', '/style-overrides.css', '/app.js', '/curriculum.json']);

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<string> {
  let body = '';
  for await (const chunk of request) body += chunk;
  return body;
}

function parseLanguage(value: unknown): Language {
  return value === 'zh' ? 'zh' : 'en';
}

function parseKind(value: unknown): AssessmentKind {
  return ['placement', 'weekly', 'phase'].includes(value as string) ? value as AssessmentKind : 'placement';
}

function sessionCookieHeader(session: SessionRecord): string {
  const maxAge = 30 * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${session.token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

async function primaryTenant(userId: string): Promise<string> {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  try {
    const { rows } = await pool.query(`SELECT tenant_id FROM memberships WHERE user_id = $1 AND role = 'learner' ORDER BY created_at LIMIT 1`, [userId]);
    const tenantId = (rows[0] as { tenant_id?: string } | undefined)?.tenant_id;
    if (!tenantId) throw Object.assign(new Error('No tenant found'), { statusCode: 404 });
    return tenantId;
  } finally {
    await pool.end();
  }
}

export function createApp() {
  const server = createServer(async (request, response) => {
    const traceId = request.headers['x-trace-id'] as string | undefined || undefined;
    const log = traceId ? requestLog.child({ trace_id: traceId }) : requestLog;
    const startedAt = Date.now();
    try {
      if (request.method === 'GET' && request.url === '/healthz') { sendJson(response, 200, { ok: true }); return; }
      if (request.method === 'GET' && request.url === '/health/ready') { sendJson(response, 200, await readiness()); return; }
      if (request.method === 'POST' && request.url === '/v1/outbox') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.topic !== 'string' || !payload.topic) throw Object.assign(new Error('topic is required'), { statusCode: 422 });
        const id = await enqueueOutbox({ topic: payload.topic, aggregateId: payload.aggregateId, payload: payload.payload ?? {} });
        sendJson(response, 201, { id });
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/outbox/publish') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.roles.includes('admin')) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const published = await publishOutbox();
        sendJson(response, 200, { published });
        return;
      }
      if (request.method === 'GET' && request.url === '/v1/consents') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const tenantId = await primaryTenant(session.userId);
        sendJson(response, 200, await getConsents(tenantId, session.userId));
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/consents') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (!isValidConsentType(payload.type)) throw Object.assign(new Error('invalid consent type'), { statusCode: 422 });
        if (typeof payload.policyVersion !== 'string' || !payload.policyVersion.trim() || payload.policyVersion.length > 50) throw Object.assign(new Error('policyVersion is required'), { statusCode: 422 });
        if (typeof payload.granted !== 'boolean') throw Object.assign(new Error('granted is required'), { statusCode: 422 });
        const tenantId = await primaryTenant(session.userId);
        const consent = await recordConsent(tenantId, session.userId, payload.type, payload.policyVersion.trim(), payload.granted);
        sendJson(response, 200, consent);
        return;
      }
      if (request.method === 'GET' && request.url === '/me/profile') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        sendJson(response, 200, await getProfile(session.userId));
        return;
      }
      if (request.method === 'PATCH' && request.url === '/me/profile') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        const profile = await upsertProfile(session.userId, {
          dailyMinutes: payload.dailyMinutes,
          correctionStyle: payload.correctionStyle,
          privacyMode: payload.privacyMode,
          accessibilityPrefs: payload.accessibilityPrefs
        });
        sendJson(response, 200, profile);
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/assessment-runs') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        const language = parseLanguage(payload.language);
        const kind = parseKind(payload.kind);
        const tenantId = await primaryTenant(session.userId);
        const profileId = await languageProfileId(tenantId, session.userId, language);
        const run = await startAssessment(tenantId, profileId, language, kind);
        sendJson(response, 201, run);
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/evidence') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        const tenantId = await primaryTenant(session.userId);
        const language = parseLanguage(payload.language);
        const profileId = await languageProfileId(tenantId, session.userId, language);
        const accepted = await appendEvidence({
          languageProfileId: profileId,
          skillCode: payload.skillCode,
          sourceType: payload.sourceType,
          sourceId: payload.sourceId,
          measure: payload.measure,
          weight: payload.weight
        });
        sendJson(response, accepted ? 201 : 200, { accepted });
        return;
      }
      if (request.method === 'GET' && (request.url || '').split('?')[0] === '/v1/me/mastery') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const url = new URL(request.url as string, 'http://localhost');
        const langParam = url.searchParams.get('language');
        const language = langParam === 'zh-CN' || langParam === 'zh' ? 'zh' as const : 'en' as const;
        const tenantId = await primaryTenant(session.userId);
        const profileId = await languageProfileId(tenantId, session.userId, language);
        sendJson(response, 200, { skills: await getMastery(profileId) });
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/review/items') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.canonicalText !== 'string' || !payload.canonicalText.trim()) throw Object.assign(new Error('canonicalText is required'), { statusCode: 422 });
        const language = payload.language === 'zh' || payload.language === 'zh-CN' ? 'zh-CN' : 'en';
        const type = ['word', 'phrase', 'grammar', 'mistake'].includes(payload.type) ? payload.type : 'phrase';
        const tenantId = await primaryTenant(session.userId);
        const profileId = await languageProfileId(tenantId, session.userId, language === 'zh-CN' ? 'zh' : 'en');
        const itemId = await ensureItem(profileId, language, type, payload.canonicalText.trim(), payload.context || {});
        sendJson(response, 201, { itemId });
        return;
      }
      if (request.method === 'GET' && (request.url || '').split('?')[0] === '/v1/reviews/due') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const url = new URL(request.url as string, 'http://localhost');
        const langParam = url.searchParams.get('language');
        const language = langParam === 'zh-CN' || langParam === 'zh' ? 'zh' as const : 'en' as const;
        const tenantId = await primaryTenant(session.userId);
        const profileId = await languageProfileId(tenantId, session.userId, language);
        sendJson(response, 200, { items: await dueItems(profileId) });
        return;
      }
      if (request.method === 'POST' && /^\/v1\/reviews\/[^/]+\/?$/.test((request.url || '').split('?')[0])) {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const parts = (request.url || '').split('?')[0].split('/');
        const itemId = parts[3];
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.grade !== 'number' || payload.grade < 0 || payload.grade > 5) throw Object.assign(new Error('grade must be 0-5'), { statusCode: 422 });
        const url = new URL(request.url as string, 'http://localhost');
        const langParam = url.searchParams.get('language');
        const language = langParam === 'zh-CN' || langParam === 'zh' ? 'zh' as const : 'en' as const;
        const tenantId = await primaryTenant(session.userId);
        const profileId = await languageProfileId(tenantId, session.userId, language);
        sendJson(response, 200, await reviewItem(profileId, itemId, payload.grade));
        return;
      }
      if (request.method === 'GET' && request.url?.startsWith('/v1/assessment-runs/')) {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        const parts = (request.url || '').split('/');
        const runId = parts[3];
        const run = await getAssessmentRun(runId, 'en', 'placement');
        if (!run) throw Object.assign(new Error('Not found'), { statusCode: 404 });
        sendJson(response, 200, run);
        return;
      }
      if (request.method === 'POST' && request.url?.includes('/attempts')) {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        const parts = (request.url || '').split('/');
        const runId = parts[3];
        const payload = JSON.parse((await readBody(request)) || '{}');
        await saveAssessmentAttempt(runId, String(payload.clientAttemptId), String(payload.itemId), payload.response);
        sendJson(response, 201, { saved: true });
        return;
      }
      if (request.method === 'POST' && request.url?.includes('/submit')) {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const parts = (request.url || '').split('/');
        const runId = parts[3];
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (!Array.isArray(payload.answers)) throw Object.assign(new Error('answers is required'), { statusCode: 400 });
        const language = parseLanguage(payload.language);
        const kind = parseKind(payload.kind);
        const tenantId = await primaryTenant(session.userId);
        const result = await submitAssessment(runId, tenantId, session.userId, language, kind, String(payload.goal || 'giao tiếp tự tin').slice(0, 300), payload.answers);
        sendJson(response, 200, result);
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/auth/register') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        const { userId, session, roles } = await register(payload);
        response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookieHeader(session) });
        response.end(JSON.stringify({ userId, session: { authenticated: true, userId, expiresAt: session.expiresAt.toISOString(), csrfToken: session.csrfToken, roles, scopes: [] } }));
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/auth/login') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        const { userId, session, roles } = await login(payload.email, payload.password);
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookieHeader(session) });
        response.end(JSON.stringify({ userId, session: { authenticated: true, userId, expiresAt: session.expiresAt.toISOString(), csrfToken: session.csrfToken, roles, scopes: [] } }));
        return;
      }
      if (request.method === 'GET' && request.url === '/v1/auth/session') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        sendJson(response, session.authenticated ? 200 : 401, session);
        return;
      }
      if (request.method === 'GET' && (request.url || '').split('?')[0] === '/v1/today') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        const url = new URL(request.url as string, 'http://localhost');
        const language = url.searchParams.get('language') === 'zh-CN' ? 'zh-CN' : 'en';
        const day = Math.min(90, Math.max(1, Number(url.searchParams.get('day')) || 1));
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const items = await getTodayPlan(config.databaseUrl, language, day);
        if (!items) { sendJson(response, 404, { error: 'No curriculum for this day' }); return; }
        sendJson(response, 200, { day, language, items });
        return;
      }
      if (request.method === 'GET' && /^\/v1\/lessons\/[^/]+\/?$/.test((request.url || '').split('?')[0])) {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const url = new URL(request.url as string, 'http://localhost');
        const parts = (request.url || '').split('?')[0].split('/');
        const type = parts[3];
        const language = url.searchParams.get('language') === 'zh-CN' || url.searchParams.get('language') === 'zh' ? 'zh' as const : 'en' as const;
        const day = Math.min(90, Math.max(1, Number(url.searchParams.get('day')) || 1));
        const lesson = await getLesson(language, day, type);
        if (!lesson) throw Object.assign(new Error('Not found'), { statusCode: 404 });
        sendJson(response, 200, lesson);
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/sessions') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.lessonId !== 'string' || !payload.lessonId) throw Object.assign(new Error('lessonId is required'), { statusCode: 422 });
        const tenantId = await primaryTenant(session.userId);
        const language = payload.language === 'zh' || payload.language === 'zh-CN' ? 'zh' as const : 'en' as const;
        const profileId = await languageProfileId(tenantId, session.userId, language);
        const sessionId = await startSession(tenantId, profileId, payload.lessonId);
        sendJson(response, 201, { sessionId });
        return;
      }
      if (request.method === 'POST' && /^\/v1\/sessions\/[^/]+\/complete$/.test((request.url || '').split('?')[0])) {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const parts = (request.url || '').split('?')[0].split('/');
        const sessionId = parts[3];
        const payload = JSON.parse((await readBody(request)) || '{}');
        const meaningfulSeconds = Number(payload.meaningfulSeconds) || 0;
        const result = await completeSession(sessionId, meaningfulSeconds);
        if (!result.completed) throw Object.assign(new Error('Session not found or already completed'), { statusCode: 409 });
        sendJson(response, 200, { completed: true });
        return;
      }
      if (request.method === 'GET' && (request.url || '').split('?')[0] === '/v1/reports/weekly') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const url = new URL(request.url as string, 'http://localhost');
        const language = url.searchParams.get('language') === 'zh-CN' || url.searchParams.get('language') === 'zh' ? 'zh' as const : 'en' as const;
        const tenantId = await primaryTenant(session.userId);
        const profileId = await languageProfileId(tenantId, session.userId, language);
        sendJson(response, 200, await weeklyReport(profileId));
        return;
      }
      if (request.method === 'GET' && (request.url || '').split('?')[0] === '/v1/me/next-best') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const url = new URL(request.url as string, 'http://localhost');
        const language = url.searchParams.get('language') === 'zh-CN' || url.searchParams.get('language') === 'zh' ? 'zh' as const : 'en' as const;
        const day = Math.min(90, Math.max(1, Number(url.searchParams.get('day')) || 1));
        const tenantId = await primaryTenant(session.userId);
        const profileId = await languageProfileId(tenantId, session.userId, language);
        sendJson(response, 200, await nextBestAction(profileId, language, day));
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/media/upload-intents') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.purpose !== 'string') throw Object.assign(new Error('purpose is required'), { statusCode: 422 });
        if (typeof payload.mimeType !== 'string' || !payload.mimeType) throw Object.assign(new Error('mimeType is required'), { statusCode: 422 });
        const bytes = Number(payload.bytes);
        if (!Number.isInteger(bytes) || bytes <= 0) throw Object.assign(new Error('bytes is required'), { statusCode: 422 });
        const tenantId = await primaryTenant(session.userId);
        const intent = await createUploadIntent(tenantId, session.userId, payload.purpose, payload.mimeType, bytes);
        sendJson(response, 201, intent);
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/speech/score') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.transcript !== 'string' || !payload.transcript.trim()) throw Object.assign(new Error('transcript is required'), { statusCode: 422 });
        if (typeof payload.targetText !== 'string' || !payload.targetText.trim()) throw Object.assign(new Error('targetText is required'), { statusCode: 422 });
        if (typeof payload.sessionId !== 'string' || !payload.sessionId) throw Object.assign(new Error('sessionId is required'), { statusCode: 422 });
        const language = payload.language === 'zh-CN' || payload.language === 'zh' ? 'zh-CN' as const : 'en' as const;
        const attemptId = payload.attemptId || `speech-${Date.now()}`;
        const analysis = await analyzeSpeech({
          attemptId,
          sessionId: payload.sessionId,
          language,
          transcript: payload.transcript.trim().slice(0, 2000),
          mediaObjectId: payload.mediaObjectId,
          targetText: payload.targetText.trim().slice(0, 2000)
        });
        await saveSpeechAttempt({
          attemptId,
          sessionId: payload.sessionId,
          language,
          transcript: payload.transcript.trim(),
          mediaObjectId: payload.mediaObjectId,
          targetText: payload.targetText.trim()
        }, analysis);
        sendJson(response, 200, analysis);
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/admin/retention') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.roles.includes('admin')) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
        if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
        const result = await runRetention();
        sendJson(response, 200, result);
        return;
      }
      if (request.method === 'DELETE' && request.url === '/v1/auth/session') {
        const token = parseSessionCookie(request.headers.cookie);
        const session = await getSession(token);
        if (session.authenticated && session.csrfToken && !csrfMatches(session.csrfToken, request.headers[CSRF_HEADER] as string | undefined)) {
          throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
        }
        await revokeSession(token);
        response.writeHead(204, { 'Set-Cookie': clearSessionCookieHeader() });
        response.end();
        return;
      }
      if (request.method === 'DELETE' && request.url === '/v1/auth/sessions') {
        const session = await getSession(parseSessionCookie(request.headers.cookie));
        if (!session.authenticated || !session.userId) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
        if (session.csrfToken && !csrfMatches(session.csrfToken, request.headers[CSRF_HEADER] as string | undefined)) {
          throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
        }
        await revokeAllSessions(session.userId);
        response.writeHead(204, { 'Set-Cookie': clearSessionCookieHeader() });
        response.end();
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/auth/recovery-requests') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        await requestPasswordRecovery(payload.email);
        response.writeHead(202, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ accepted: true }));
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/auth/recovery-confirmations') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (!validateRecoveryToken(payload.token)) throw Object.assign(new Error('token is required'), { statusCode: 422 });
        await confirmPasswordRecovery(payload.token, payload.newPassword);
        response.writeHead(204);
        response.end();
        return;
      }
      if (request.method === 'GET' && request.url === '/api/ai/status') {
        const providers = configuredProviders();
        sendJson(response, 200, { configured: providers.length > 0, preferred: config.aiProvider, providers, active: providerOrder()[0] || 'demo' });
        return;
      }
      if (request.method === 'POST' && request.url === '/api/assessment/start') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        const language = parseLanguage(payload.language);
        const kind = parseKind(payload.kind);
        sendJson(response, 200, {
          assessmentId: `${kind}-${language}-${Date.now()}`,
          language, kind,
          durationMinutes: kind === 'placement' ? 8 : 10,
          questions: publicQuestions(language),
          notice: 'Điểm nói từ transcript chỉ là sơ bộ; phát âm/thanh điệu cần audio analyzer.'
        });
        return;
      }
      if (request.method === 'POST' && request.url === '/api/assessment/submit') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (!Array.isArray(payload.answers)) throw Object.assign(new Error('answers is required'), { statusCode: 400 });
        const language = parseLanguage(payload.language);
        const kind = parseKind(payload.kind);
        const result = scoreAssessment(language, payload.answers);
        const plan = await assessmentFeedback(result, language, kind, String(payload.goal || 'giao tiếp tự tin').slice(0, 300));
        sendJson(response, 200, { ...result, kind, language, plan });
        return;
      }
      if (request.method === 'POST' && request.url === '/api/coach') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.message !== 'string' || !payload.message.trim()) throw new Error('message is required');
        sendJson(response, 200, await coachReply(payload.message.trim().slice(0, 1200), parseLanguage(payload.language)));
        return;
      }
      if (request.method === 'POST' && request.url === '/api/lesson') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        sendJson(response, 200, await lessonReply(payload.language === 'zh' ? 'zh' : 'en', payload.goal));
        return;
      }
      if (request.method === 'POST' && request.url === '/api/voice') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.text !== 'string' || !payload.text.trim()) throw new Error('text is required');
        const result = await openvoxSpeech(payload.text.trim().slice(0, 2000), payload.language === 'zh-CN' || payload.language === 'zh' ? 'zh' : 'en');
        response.writeHead(200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store', 'X-OpenVox-Model': result.model, 'X-OpenVox-Voice': result.voice });
        response.end(result.audio);
        return;
      }
      const requested = normalize(request.url === '/' ? '/index.html' : (request.url || '/').split('?')[0]);
      if (!publicFiles.has(requested)) throw new Error('not public');
      const filePath = join(root, requested);
      const content = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
      response.end(content);
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode || (error instanceof Error && (error.message === 'message is required' || error.message === 'text is required') ? 400 : 404);
      if (status >= 500) log.error('request failed', { method: request.method, url: request.url, status, error: error instanceof Error ? error.message : String(error) });
      sendJson(response, status, { error: status === 503 ? 'OpenVox unavailable' : status === 400 ? (error as Error).message : 'Not found' });
    } finally {
      if (request.url?.startsWith('/v1/')) log.info('request', { method: request.method, url: request.url, duration_ms: Date.now() - startedAt });
    }
  });
  attachVoiceGateway(server);
  return server;
}

if (process.env.NODE_ENV !== 'test') {
  createApp().listen(config.port, () => console.log(`LingoPilot listening on http://localhost:${config.port}`));
}
