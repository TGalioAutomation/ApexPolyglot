// LingoVoice — Node server
// - Phục vụ frontend tĩnh trong /public
// - Proxy OpenVox local TTS tại http://127.0.0.1:8000/v1
// Tuân theo hợp đồng OpenVox:
//   1. GET /models -> khám phá model id
//   2. POST /models/{model}/load -> warm trước request đầu
//   3. GET /models/{model}/languages -> ngôn ngữ hợp lệ
//   4. GET /models/{model}/voices?language={code} -> chọn giọng tương thích
//   5. Dùng lại cùng language code trong POST /audio/speech
//   6. POST /audio/speech (model,input,language,voice,response_format=wav)
//  11. 429 -> chờ và retry (chỉ một job sinh audio tại một thời điểm)
//  12. Giọng thiếu -> fetch lại danh sách và chọn thay thế hợp lệ
//  13. Server không sẵn sàng -> trả 503 để frontend fallback text/browser TTS
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

// Nạp .env cục bộ (không ghi đè biến đã có trong môi trường)
const ENV_PATH = join(ROOT, '.env');
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.PORT || 4174);
const HOST = process.env.HOST || '0.0.0.0';
const ACCESS_USER = process.env.APP_ACCESS_USER || 'student';
const ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD || '';
const ADMIN_USER = process.env.ADMIN_ACCESS_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_ACCESS_PASSWORD || '';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 64 * 1024);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

import { teacherSystem, normalizeTeacherProfile, runTeacher, configuredProviders, providerOrder, generateVocabCard, writingFeedback, roleplayTurn, roleplayFeedback, pronunciationFeedback } from './ai.mjs';
import { publicQuestions, scorePlacement } from './placement.mjs';
import { VoiceClient, speakWithCache, OPENVOX_API, audioCacheKey, hasCachedAudio, readCachedAudio, writeCachedAudio, readPreparedAudio, preparedAudioStats } from './voice.mjs';
import { pregenAll } from './pregen.mjs';
import { loadMemory, saveMemory, addMemoryNote, buildMemoryPrompt } from './memory.mjs';
import { AdminService } from './admin.mjs';
import { initializeStore } from './db/store.mjs';
import { validLang, lessonRowsToApi, readingRowsToApi, roleplayRowsToApi } from './db/content-map.mjs';
import { hashPassword, verifyPassword, passwordStrengthOk, newSessionToken, tokenHash, sessionExpiry, sessionCookie, clearSessionCookie, parseSessionCookie, resolveSession, publicUser } from './db/auth.mjs';
import { normalizeSyncPayload, mapLegacyLocalState, validAgeGroup, validRegisterRole } from './db/sync.mjs';
import { loadMemoryFromStore, saveMemoryToStore, buildSyncSnapshot } from './db/memory-adapter.mjs';
import { normalizeActivityPayload, xpForActivity, computeStreaks, levelOf, badgeStats, newlyEarnedBadges, BADGES, newInviteCode, validInviteCode, parentSuggestions, utcDayKey, shiftDayKey } from './db/gamification.mjs';
import { normalizeToeicSubmit, byKindFromAttempts, scoreOf, aggregateToeicHistory } from './db/toeic.mjs';

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let body = '';
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) {
      throw Object.assign(new Error('request body too large'), { statusCode: 413 });
    }
    body += chunk;
  }
  return body;
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function hasAccess(request) {
  if (!ACCESS_PASSWORD) return true;
  const header = request.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return false;
    return safeEqual(decoded.slice(0, separator), ACCESS_USER)
      && safeEqual(decoded.slice(separator + 1), ACCESS_PASSWORD);
  } catch {
    return false;
  }
}

function hasBasicCredentials(request, user, password) {
  const header = request.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    return separator >= 0
      && safeEqual(decoded.slice(0, separator), user)
      && safeEqual(decoded.slice(separator + 1), password);
  } catch {
    return false;
  }
}

function isLoopback(request) {
  const address = request.socket.remoteAddress || '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function hasAdminAccess(request) {
  return ADMIN_PASSWORD ? hasBasicCredentials(request, ADMIN_USER, ADMIN_PASSWORD) : isLoopback(request);
}

// Parse SSE của OpenVox -> yield Buffer WAV cho mỗi event "audio.chunk"
async function* parseSSE(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let event = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        if (line.startsWith('event: ')) event = line.slice(7);
        else if (line.startsWith('data: ') && event === 'audio.chunk' && line.length > 6) {
          try {
            const data = JSON.parse(line.slice(6));
            const b64 = data && data.audio; // OpenVox gửi audio ở top-level (data.audio)
            if (b64) yield Buffer.from(b64, 'base64');
          } catch { /* bỏ chunk lỗi */ }
        }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

const voice = new VoiceClient();
const admin = new AdminService({
  root: ROOT,
  voiceStatus: () => voice.status(),
  aiStatus: () => ({ configured: configuredProviders().length > 0, active: providerOrder()[0] || null, providers: configuredProviders() })
});

// ---- PostgreSQL store (ADR-001). Thiếu DATABASE_URL -> app vẫn chạy, account/sync trả 503 DB_UNAVAILABLE.
const store = await initializeStore({ migrate: process.env.MIGRATE_ON_START === '1' });
admin.store = store; // pregen quét cả nội dung CMS trong DB (roadmap #2)
const apiError = (message, statusCode, code) => Object.assign(new Error(message), { statusCode, code });
function requireDb() {
  if (!store) throw apiError('Server chưa cấu hình PostgreSQL (thiếu DATABASE_URL).', 503, 'DB_UNAVAILABLE');
}
function requireRole(session, role) {
  if (session.user.role !== role) throw apiError('Tài khoản này không dùng được tính năng đó.', 403, 'ROLE_REQUIRED');
}

// ---- Gamification helpers (roadmap #4) ----
// day do client gửi (múi giờ người học có thể trước UTC tối đa ~14h → cho phép +1 ngày)
function learnerDayKey(raw) {
  const today = utcDayKey();
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    && raw >= shiftDayKey(today, -400) && raw <= shiftDayKey(today, 1)) return raw;
  return today;
}

function sumRecent(rows, dayKey, days, field) {
  const from = shiftDayKey(dayKey, -(days - 1));
  return rows.filter((r) => r.day >= from && r.day <= dayKey).reduce((a, r) => a + (r[field] || 0), 0);
}

// Tính summary + phát huy hiệu mới (ghi earned_badges). Dùng cho cả /api/activity và summary.
async function gamificationSummary(userId, dayKey) {
  const rows = await store.listDailyActivity(userId, 400);
  const streaks = computeStreaks(rows.map((r) => r.day), dayKey);
  const srs = await store.srsCounts(userId);
  const stats = badgeStats({ activityRows: rows, streak: streaks.current, srsTotal: srs.total, srsMastered: srs.mastered });
  const earned = await store.listEarnedBadges(userId);
  const fresh = newlyEarnedBadges(stats, new Set(earned.map((e) => e.badge_id)));
  const newBadges = [];
  for (const b of fresh) {
    const at = await store.addEarnedBadge(userId, b.id);
    if (at) newBadges.push({ id: b.id, name: b.name, icon: b.icon, desc: b.desc, earnedAt: at });
  }
  const earnedAtOf = (id) => earned.find((e) => e.badge_id === id)?.earned_at
    || newBadges.find((n) => n.id === id)?.earnedAt || null;
  return {
    day: dayKey,
    xp: {
      total: stats.totalXp,
      today: rows.find((r) => r.day === dayKey)?.xp || 0,
      week: sumRecent(rows, dayKey, 7, 'xp')
    },
    streak: streaks,
    level: levelOf(stats.totalXp),
    badges: BADGES.map((b) => ({
      id: b.id, name: b.name, icon: b.icon, desc: b.desc,
      earned: Boolean(earnedAtOf(b.id)), earnedAt: earnedAtOf(b.id)
    })),
    newBadges,
    srs: { total: srs.total, mastered: srs.mastered },
    // Đủ 14 cột kể cả ngày không học — biểu đồ tuần không bị lệch nhịp
    days: Array.from({ length: 14 }, (_, i) => {
      const day = shiftDayKey(dayKey, i - 13);
      const row = rows.find((r) => r.day === day);
      return { day, minutes: row?.minutes || 0, words: row?.words || 0, xp: row?.xp || 0 };
    }),
    activity: {
      daysActive: stats.daysActive,
      minutes7d: sumRecent(rows, dayKey, 7, 'minutes'),
      words7d: sumRecent(rows, dayKey, 7, 'words'),
      lastActiveDay: rows.length ? rows[rows.length - 1].day : null,
      missedDays: missedDaysUpTo(new Set(rows.map((r) => r.day)), dayKey)
    }
  };
}

// Số ngày nghỉ liên tiếp tính đến HÔM QUA (hôm nay chưa học không tính là nghỉ)
function missedDaysUpTo(daySet, dayKey) {
  let missed = 0;
  let cursor = shiftDayKey(dayKey, -1);
  while (!daySet.has(cursor)) { missed += 1; cursor = shiftDayKey(cursor, -1); if (missed > 90) break; }
  return missed;
}

const server = createServer(async (request, response) => {
  const url = request.url || '/';
  const pathname = url.split('?')[0];
  try {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=()');

    const adminRoute = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');
    const liveSynthesisRoute = pathname === '/api/voice/speak' || pathname === '/api/voice/speak/stream';
    const teacherSynthesisRoute = pathname === '/api/voice/teacher';

    // Admin dùng credential riêng. Khi chưa cấu hình, chỉ máy local được phép truy cập.
    if (adminRoute && !hasAdminAccess(request)) {
      response.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="LingoVoice Admin", charset="UTF-8"',
        'Cache-Control': 'no-store'
      });
      response.end('Administrator authentication required');
      return;
    }

    // Sinh audio trực tiếp chỉ dành cho pipeline quản trị hoặc truy cập loopback cục bộ.
    if (liveSynthesisRoute && !hasAdminAccess(request)) {
      response.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="LingoVoice Admin", charset="UTF-8"',
        'Cache-Control': 'no-store'
      });
      response.end('Administrator authentication required');
      return;
    }

    // Bản public có thể bật Basic Auth để bảo vệ API AI và bộ nhớ học viên.
    // Healthcheck luôn mở để container/reverse proxy giám sát mà không cần secret.
    if (!adminRoute && pathname !== '/healthz' && !hasAccess(request)) {
      response.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="LingoVoice", charset="UTF-8"',
        'Cache-Control': 'no-store'
      });
      response.end('Authentication required');
      return;
    }

    // ---- API ----
    // ---- Tài khoản + đồng bộ (ADR-001/002/004, hợp đồng docs/api-spec.md §1) ----
    if (request.method === 'POST' && pathname === '/api/auth/register') {
      requireDb();
      const payload = JSON.parse((await readBody(request)) || '{}');
      const username = typeof payload.username === 'string' ? payload.username.trim().toLowerCase() : '';
      if (!/^[a-z0-9_.-]{3,32}$/.test(username)) throw apiError('Tên đăng nhập 3–32 ký tự (a-z, 0-9, ., _, -).', 400, 'USERNAME_INVALID');
      if (!passwordStrengthOk(payload.password)) throw apiError('Mật khẩu cần ít nhất 8 ký tự.', 400, 'WEAK_PASSWORD');
      if (await store.findUserByUsername(username)) throw apiError('Tên đăng nhập đã tồn tại.', 409, 'USERNAME_TAKEN');
      const user = await store.createUser({
        username,
        passwordHash: hashPassword(payload.password),
        displayName: typeof payload.displayName === 'string' ? payload.displayName.trim().slice(0, 60) : '',
        ageGroup: validAgeGroup(payload.ageGroup),
        role: validRegisterRole(payload.role)
      });
      const token = newSessionToken();
      await store.createSession({ userId: user.id, tokenHash: tokenHash(token), expiresAt: sessionExpiry() });
      response.setHeader('Set-Cookie', sessionCookie(token));
      return sendJson(response, 201, { user: publicUser(user) });
    }

    if (request.method === 'POST' && pathname === '/api/auth/login') {
      requireDb();
      const payload = JSON.parse((await readBody(request)) || '{}');
      const user = typeof payload.username === 'string' ? await store.findUserByUsername(payload.username) : null;
      if (!user || !verifyPassword(payload.password, user.password_hash)) {
        throw apiError('Sai tên đăng nhập hoặc mật khẩu.', 401, 'INVALID_CREDENTIALS');
      }
      const token = newSessionToken();
      await store.createSession({ userId: user.id, tokenHash: tokenHash(token), expiresAt: sessionExpiry() });
      response.setHeader('Set-Cookie', sessionCookie(token));
      return sendJson(response, 200, { user: publicUser(user) });
    }

    if (request.method === 'POST' && pathname === '/api/auth/logout') {
      const token = parseSessionCookie(request);
      if (store && token) await store.deleteSession(tokenHash(token));
      response.setHeader('Set-Cookie', clearSessionCookie());
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === 'GET' && pathname === '/api/auth/me') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      return sendJson(response, 200, { user: publicUser(session.user) });
    }

    if (request.method === 'POST' && pathname === '/api/sync/push') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const payload = normalizeSyncPayload(JSON.parse((await readBody(request)) || '{}'));
      let srsAccepted = 0;
      for (const item of payload.srs) if (await store.upsertSrsItem(session.user.id, item)) srsAccepted += 1;
      const mistakesAccepted = payload.mistakes.length ? await store.insertMistakes(session.user.id, payload.mistakes) : 0;
      const patch = payload.profilePatch;
      if (patch.placements && typeof patch.placements === 'object') {
        for (const lang of ['en', 'zh']) {
          const p = patch.placements[lang];
          if (p && Number.isFinite(p.level)) {
            await store.insertPlacement({ userId: session.user.id, lang, level: p.level, overall: Number.isFinite(p.overall) ? p.overall : null, skills: p.skills || {}, weakest: p.weakest || null });
          }
        }
        delete patch.placements;
      }
      if (Object.keys(patch).length) await store.patchProfile(session.user.id, patch);
      return sendJson(response, 200, { accepted: { srs: srsAccepted, mistakes: mistakesAccepted } });
    }

    if (request.method === 'GET' && pathname === '/api/sync/pull') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      return sendJson(response, 200, await buildSyncSnapshot(store, session.user));
    }

    if (request.method === 'POST' && pathname === '/api/sync/import-local') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const legacy = mapLegacyLocalState(JSON.parse((await readBody(request)) || '{}'));
      let srsAccepted = 0;
      for (const item of legacy.srs) if (await store.upsertSrsItem(session.user.id, item)) srsAccepted += 1;
      const mistakesAccepted = legacy.mistakes.length ? await store.insertMistakes(session.user.id, legacy.mistakes) : 0;
      const profilePatch = {
        goals: legacy.profile.goals,
        dailyMinutes: legacy.profile.dailyMinutes,
        enRatio: legacy.profile.splitEn / 100
      };
      if (legacy.profile.journeyStartedAt) profilePatch.journeyStartedAt = legacy.profile.journeyStartedAt;
      if (legacy.teacherProfile) profilePatch.teacherProfile = legacy.teacherProfile;
      if (legacy.progress) profilePatch.progress = legacy.progress;
      for (const lang of ['en', 'zh']) {
        const p = legacy.profile.placement && legacy.profile.placement[lang];
        if (p && Number.isFinite(p.level)) {
          await store.insertPlacement({ userId: session.user.id, lang, level: p.level, overall: Number.isFinite(p.overall) ? p.overall : null, skills: p.skills || {}, weakest: p.weakest || null });
        }
      }
      await store.patchProfile(session.user.id, profilePatch);
      return sendJson(response, 200, { imported: { srs: srsAccepted, mistakes: mistakesAccepted } });
    }

    // ---- Gamification + phụ huynh (roadmap #4, hợp đồng docs/api-spec.md §2) ----
    if (request.method === 'POST' && pathname === '/api/activity') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const payload = normalizeActivityPayload(JSON.parse((await readBody(request)) || '{}'));
      const xp = xpForActivity(payload);
      const correct = payload.attempts.filter((a) => a.correct === true).length;
      await store.bumpDailyActivity(session.user.id, payload.day, {
        minutes: payload.minutes, words: payload.words, xp,
        attempts: payload.attempts.length, correct
      });
      if (payload.attempts.length) await store.recordAttempts(session.user.id, payload.attempts);
      return sendJson(response, 200, { ...(await gamificationSummary(session.user.id, payload.day)), added: { xp, minutes: payload.minutes, words: payload.words, attempts: payload.attempts.length } });
    }

    if (request.method === 'GET' && pathname === '/api/gamification/summary') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const day = learnerDayKey(new URL(request.url, 'http://local').searchParams.get('day'));
      return sendJson(response, 200, await gamificationSummary(session.user.id, day));
    }

    // ---- Thi thử TOEIC cuối buổi: nộp bài + lịch sử kỹ năng (docs/api-spec.md §3b) ----
    if (request.method === 'POST' && pathname === '/api/toeic/submit') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const payload = normalizeToeicSubmit(JSON.parse((await readBody(request)) || '{}'));
      if (!payload.attempts.length) throw apiError('Bài thi không có câu trả lời hợp lệ.', 400, 'TOEIC_INVALID');
      const total = payload.attempts.length;
      const correct = payload.attempts.filter((a) => a.correct === true).length;
      const byKind = byKindFromAttempts(payload.attempts);
      const minutes = Math.min(60, Math.round(payload.usedSec / 60));
      const xp = xpForActivity({ minutes, attempts: payload.attempts });
      const created = await store.createLearningSession({
        userId: session.user.id,
        skill: 'toeic',
        stats: {
          version: 1,
          form: payload.form,
          durationMin: payload.durationMin,
          usedSec: payload.usedSec,
          total, correct,
          score: scoreOf(correct, total),
          byKind
        }
      });
      await store.recordAttempts(session.user.id, payload.attempts, created.id);
      await store.bumpDailyActivity(session.user.id, payload.day, {
        minutes, words: 0, xp, attempts: total, correct
      });
      return sendJson(response, 200, {
        ...(await gamificationSummary(session.user.id, payload.day)),
        added: { xp, minutes, attempts: total },
        result: { id: created.id, score: scoreOf(correct, total), total, correct, byKind }
      });
    }

    if (request.method === 'GET' && pathname === '/api/toeic/history') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const rows = await store.listSessionsBySkill(session.user.id, 'toeic', 60);
      return sendJson(response, 200, aggregateToeicHistory(rows));
    }

    if (request.method === 'POST' && pathname === '/api/parent/invite') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      requireRole(session, 'parent');
      const code = newInviteCode();
      const expiresAt = new Date(Date.now() + 7 * 86400000);
      await store.createParentInvite(session.user.id, code, expiresAt);
      return sendJson(response, 201, { code, expiresAt });
    }

    if (request.method === 'GET' && pathname === '/api/parent/invites') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      requireRole(session, 'parent');
      return sendJson(response, 200, { invites: await store.listParentInvites(session.user.id) });
    }

    if (request.method === 'GET' && pathname === '/api/parent/children') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      requireRole(session, 'parent');
      const day = learnerDayKey(new URL(request.url, 'http://local').searchParams.get('day'));
      const children = [];
      for (const row of await store.listChildrenForParent(session.user.id)) {
        const summary = await gamificationSummary(row.id, day);
        children.push({
          id: row.id, username: row.username, displayName: row.display_name || row.username,
          linkedAt: row.linked_at, ageGroup: undefined,
          streak: summary.streak.current, xp: summary.xp.total,
          minutes7d: summary.activity.minutes7d, words7d: summary.activity.words7d,
          lastActiveDay: summary.activity.lastActiveDay
        });
      }
      return sendJson(response, 200, { children });
    }

    if (request.method === 'GET' && pathname.startsWith('/api/parent/children/') && pathname.endsWith('/dashboard')) {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      requireRole(session, 'parent');
      const childId = decodeURIComponent(pathname.slice('/api/parent/children/'.length, -'/dashboard'.length));
      if (!(await store.isLinked(session.user.id, childId))) {
        throw apiError('Chưa liên kết với học viên này.', 404, 'CHILD_NOT_LINKED');
      }
      const child = await store.findUserById(childId);
      if (!child) throw apiError('Không tìm thấy học viên.', 404, 'CHILD_NOT_FOUND');
      const day = learnerDayKey(new URL(request.url, 'http://local').searchParams.get('day'));
      const summary = await gamificationSummary(childId, day);
      const profile = await store.getProfile(childId);
      const dueCount = await store.srsDueCount(childId);
      const topMistakes = await store.topMistakes(childId, 14, 5);
      const attempts = await store.attemptsBreakdown(childId, 14);
      const missed = summary.activity.missedDays;
      return sendJson(response, 200, {
        child: { id: child.id, username: child.username, displayName: child.display_name || child.username, ageGroup: child.age_group },
        day,
        streak: summary.streak,
        xp: summary.xp,
        level: summary.level,
        srs: { ...summary.srs, due: dueCount },
        days: summary.days,
        activity: summary.activity,
        attempts,
        topMistakes,
        badges: summary.badges.filter((b) => b.earned),
        dailyMinutes: profile?.daily_minutes || 25,
        suggestions: parentSuggestions({
          missedDays: missed, dueCount, topMistakes,
          minutes7d: summary.activity.minutes7d,
          dailyMinutes: profile?.daily_minutes || 25,
          streak: summary.streak.current
        })
      });
    }

    if (request.method === 'DELETE' && pathname.startsWith('/api/parent/children/')) {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      requireRole(session, 'parent');
      const childId = decodeURIComponent(pathname.slice('/api/parent/children/'.length));
      const removed = await store.unlinkParentChild(session.user.id, childId);
      if (!removed) throw apiError('Chưa liên kết với học viên này.', 404, 'CHILD_NOT_LINKED');
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === 'POST' && pathname === '/api/parent/link') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      if (session.user.role === 'parent') throw apiError('Tài khoản phụ huynh không tự liên kết với mình.', 400, 'ROLE_REQUIRED');
      const payload = JSON.parse((await readBody(request)) || '{}');
      const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : '';
      if (!validInviteCode(code)) throw apiError('Mã liên kết gồm 8 ký tự (bỏ qua 0/O và 1/I).', 400, 'INVITE_CODE_INVALID');
      const parent = await store.redeemParentInvite(session.user.id, code);
      if (!parent) throw apiError('Mã không đúng, đã dùng hoặc đã hết hạn.', 404, 'INVITE_CODE_INVALID');
      return sendJson(response, 200, { parent: publicUser(parent) });
    }

    if (request.method === 'GET' && pathname === '/api/parent/links') {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const parents = (await store.listParentsForChild(session.user.id)).map((p) => ({
        id: p.id, displayName: p.display_name || p.username, linkedAt: p.linked_at
      }));
      return sendJson(response, 200, { parents });
    }

    if (request.method === 'DELETE' && pathname.startsWith('/api/parent/link/')) {
      requireDb();
      const session = await resolveSession(store, request);
      if (!session) throw apiError('Chưa đăng nhập.', 401, 'NO_SESSION');
      const parentId = decodeURIComponent(pathname.slice('/api/parent/link/'.length));
      const removed = await store.unlinkParentChild(parentId, session.user.id);
      if (!removed) throw apiError('Chưa liên kết với phụ huynh này.', 404, 'LINK_NOT_FOUND');
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === 'GET' && pathname === '/healthz') {
      return sendJson(response, 200, { ok: true });
    }

    // ---- Control plane quản trị: chỉ chuẩn bị/audit dữ liệu, không trả secret ----
    if (request.method === 'GET' && pathname === '/api/admin/overview') {
      return sendJson(response, 200, { ...(await admin.overview()), db: store ? { available: true } : { available: false } });
    }
    if (request.method === 'GET' && pathname === '/api/admin/jobs') {
      return sendJson(response, 200, { jobs: admin.listJobs() });
    }
    if (request.method === 'GET' && pathname.startsWith('/api/admin/jobs/')) {
      return sendJson(response, 200, admin.getJob(decodeURIComponent(pathname.slice('/api/admin/jobs/'.length))));
    }
    if (request.method === 'POST' && pathname === '/api/admin/jobs/pregen') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      return sendJson(response, 202, admin.startPregen(payload));
    }
    if (request.method === 'POST' && pathname === '/api/admin/jobs/audit') {
      return sendJson(response, 202, admin.startAudit());
    }
    if (request.method === 'POST' && pathname === '/api/admin/jobs/vocab') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      return sendJson(response, 202, admin.startVocabPreparation(payload));
    }
    if (request.method === 'GET' && pathname === '/api/admin/vocab') {
      const params = new URL(request.url, 'http://local').searchParams;
      return sendJson(response, 200, await admin.listVocab({
        language: params.get('language'), query: params.get('query'), level: params.get('level'), limit: params.get('limit')
      }));
    }
    if (request.method === 'POST' && pathname === '/api/admin/vocab/review') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      return sendJson(response, 200, await admin.setVocabReviewed(payload));
    }

    // ---- CMS nội dung (roadmap #2): /api/admin/content/<type>[/<id>|/ai-draft|/<id>/review] ----
    if (pathname === '/api/admin/content' || pathname.startsWith('/api/admin/content/')) {
      const segs = pathname.slice('/api/admin/content/'.length).split('/').filter(Boolean).map(decodeURIComponent);
      const type = segs[0];
      if (!['lessons', 'readings', 'roleplay'].includes(type)) throw apiError('Loại nội dung không hợp lệ.', 400, 'TYPE_INVALID');
      if (segs.length === 1 && request.method === 'GET') {
        const params = new URL(request.url, 'http://local').searchParams;
        return sendJson(response, 200, await admin.listContent({ type, language: params.get('lang'), status: params.get('status') }));
      }
      if (segs.length === 1 && request.method === 'POST') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        return sendJson(response, 201, await admin.saveContent({ type, payload }));
      }
      if (segs.length === 2 && segs[1] === 'ai-draft' && request.method === 'POST') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        return sendJson(response, 201, await admin.aiDraft({ type, ...payload, language: payload.lang }));
      }
      if (segs.length === 2 && request.method === 'PUT') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        return sendJson(response, 200, await admin.saveContent({ type, id: segs[1], payload }));
      }
      if (segs.length === 3 && segs[2] === 'review' && request.method === 'POST') {
        const payload = JSON.parse((await readBody(request)) || '{}');
        return sendJson(response, 200, await admin.reviewContent({ type, id: segs[1], reviewed: payload.reviewed }));
      }
      if (segs.length === 2 && request.method === 'DELETE') {
        return sendJson(response, 200, await admin.deleteContentItem({ type, id: segs[1] }));
      }
      throw apiError('Không hỗ trợ thao tác này.', 405, 'METHOD_NOT_ALLOWED');
    }
    if (request.method === 'POST' && pathname === '/api/admin/jobs/content-seed') {
      return sendJson(response, 202, admin.startContentSeed());
    }

    // ---- Nội dung học (roadmap #2): learner đọc nội dung đã duyệt từ DB; DB tắt -> lỗi chuẩn, frontend fallback literal ----
    if (request.method === 'GET' && pathname.startsWith('/api/content/')) {
      const kind = pathname.slice('/api/content/'.length);
      if (!['lessons', 'readings', 'roleplay'].includes(kind)) throw apiError('Không rõ loại nội dung.', 404, 'NOT_FOUND');
      const lang = validLang(new URL(request.url, 'http://local').searchParams.get('lang'));
      if (!lang) throw apiError('Ngôn ngữ phải là en hoặc zh.', 400, 'LANG_INVALID');
      requireDb();
      const { rows, items } = await store.listContent(kind, { lang, status: 'reviewed' });
      if (kind === 'lessons') return sendJson(response, 200, { lessons: lessonRowsToApi(rows, items) });
      if (kind === 'readings') return sendJson(response, 200, { levels: readingRowsToApi(rows) });
      return sendJson(response, 200, { scenarios: roleplayRowsToApi(rows) });
    }

    if (request.method === 'GET' && pathname === '/api/voice/status') {
      return sendJson(response, 200, { ...(await voice.status()), deliveryMode: 'prepared-only', prepared: await preparedAudioStats() });
    }

    // Client người học chỉ đọc WAV đã được control plane tạo trước.
    if (request.method === 'POST' && pathname === '/api/voice/prepared') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) throw Object.assign(new Error('text is required'), { statusCode: 400 });
      if (text.length > 2000) throw Object.assign(new Error('text too long'), { statusCode: 400 });
      const language = payload.language === 'zh' || payload.language === 'zh-CN'
        ? 'zh'
        : payload.language === 'en' || payload.language === 'en-US' || payload.language === undefined ? 'en' : null;
      if (!language) throw Object.assign(new Error('language must be "en" or "zh"'), { statusCode: 400 });
      const prepared = await readPreparedAudio({
        text,
        language,
        model: typeof payload.model === 'string' ? payload.model : undefined,
        voice: typeof payload.voice === 'string' ? payload.voice : undefined,
        speed: payload.speed
      });
      if (!prepared) return sendJson(response, 404, { error: 'Audio chưa được quản trị viên chuẩn bị.', code: 'AUDIO_NOT_PREPARED' });
      response.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': prepared.audio.length,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Audio-Cache': 'prepared',
        'X-Voice-Model': prepared.entry.model || 'prepared',
        'X-Voice-Name': prepared.entry.voice || 'prepared'
      });
      response.end(prepared.audio);
      return;
    }

    // Cô Linh cần đọc câu trả lời động của AI. Route này vẫn nằm sau auth public,
    // còn route /api/voice/speak tiếp tục là control-plane/admin-only.
    if (request.method === 'POST' && teacherSynthesisRoute) {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) throw Object.assign(new Error('text is required'), { statusCode: 400 });
      if (text.length > 2000) throw Object.assign(new Error('text too long'), { statusCode: 400 });
      const language = payload.language === 'vi' || payload.language === 'vi-VN'
        ? 'vi'
        : payload.language === 'zh' || payload.language === 'zh-CN'
          ? 'zh'
          : payload.language === 'en' || payload.language === 'en-US' || payload.language === undefined
            ? 'en'
            : null;
      if (!language) throw Object.assign(new Error('language must be "vi", "en" or "zh"'), { statusCode: 400 });
      const result = await speakWithCache(voice, {
        text,
        language,
        voice: typeof payload.voice === 'string' ? payload.voice : undefined,
        model: typeof payload.model === 'string' ? payload.model : undefined,
        speed: payload.speed
      });
      response.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-Voice-Model': result.model || 'cache',
        'X-Voice-Language': result.language,
        'X-Voice-Name': result.voice || 'cache',
        'X-Audio-Cache': result.cached ? 'hit' : 'miss'
      });
      response.end(result.audio);
      return;
    }

    if (request.method === 'GET' && pathname === '/api/voice/options') {
      return sendJson(response, 200, { available: true, languages: await voice.options() });
    }

    // ---- Streaming TTS (proxy SSE OpenVox, forward từng chunk, tự lưu cache) ----
    if (request.method === 'POST' && pathname === '/api/voice/speak/stream') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) throw Object.assign(new Error('text is required'), { statusCode: 400 });
      if (text.length > 2000) throw Object.assign(new Error('text too long'), { statusCode: 400 });
      const language = payload.language === 'zh' || payload.language === 'zh-CN'
        ? 'zh'
        : payload.language === 'en' || payload.language === 'en-US' || payload.language === undefined ? 'en' : null;
      if (!language) throw Object.assign(new Error('language must be "en" or "zh"'), { statusCode: 400 });
      const modelArg = typeof payload.model === 'string' ? payload.model : undefined;
      const voiceArg = typeof payload.voice === 'string' ? payload.voice : undefined;
      const speed = Number(payload.speed) || 1.0;

      const modelId = await voice.resolveModelFor(language, modelArg);
      const chosenVoice = await voice.resolveVoice(modelId, language, voiceArg);
      const key = audioCacheKey({ language, text, model: modelId, voice: chosenVoice, speed });

      // Cache sẵn -> trả full WAV ngay
      if (hasCachedAudio(key)) {
        const audio = await readCachedAudio(key);
        response.writeHead(200, {
          'Content-Type': 'audio/wav',
          'Content-Length': audio.length,
          'X-Audio-Cache': 'hit',
          'X-Voice-Model': modelId,
          'X-Voice-Name': chosenVoice
        });
        response.end(audio);
        return;
      }

      // Chưa có -> stream từ OpenVox, forward chunk, gộp lưu cache khi xong
      const st = await voice.synthesizeStream({ text, language, voice: chosenVoice, model: modelId, speed });
      response.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'Transfer-Encoding': 'chunked',
        'X-Audio-Cache': 'miss',
        'X-Stream': 'openvox',
        'X-Voice-Model': st.model,
        'X-Voice-Name': st.voice
      });
      const parts = [];
      try {
        for await (const chunk of parseSSE(st.stream)) {
          parts.push(chunk);
          response.write(chunk);
        }
        const full = Buffer.concat(parts);
        if (full.length) await writeCachedAudio(key, full);
      } catch (e) {
        console.error('[stream]', e.message);
      }
      response.end();
      return;
    }

    if (request.method === 'POST' && pathname === '/api/voice/speak') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) throw Object.assign(new Error('text is required'), { statusCode: 400 });
      if (text.length > 2000) throw Object.assign(new Error('text too long'), { statusCode: 400 });
      const language = payload.language === 'zh' || payload.language === 'zh-CN'
        ? 'zh'
        : payload.language === 'en' || payload.language === 'en-US' || payload.language === undefined
          ? 'en'
          : null;
      if (!language) throw Object.assign(new Error('language must be "en" or "zh"'), { statusCode: 400 });
      const result = await speakWithCache(voice, {
        text,
        language,
        voice: typeof payload.voice === 'string' ? payload.voice : undefined,
        model: typeof payload.model === 'string' ? payload.model : undefined,
        speed: payload.speed
      });
      response.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-Voice-Model': result.model || 'cache',
        'X-Voice-Language': result.language,
        'X-Voice-Name': result.voice || 'cache',
        'X-Audio-Cache': result.cached ? 'hit' : 'miss'
      });
      response.end(result.audio);
      return;
    }

    // ---- Placement test ----
    if (request.method === 'POST' && pathname === '/api/placement/start') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const language = payload.language === 'zh' ? 'zh' : 'en';
      return sendJson(response, 200, {
        assessmentId: `placement-${language}-${Date.now()}`,
        language,
        durationMinutes: 8,
        questions: publicQuestions(language),
        notice: 'Điểm nói từ transcript chỉ là sơ bộ.'
      });
    }

    if (request.method === 'POST' && pathname === '/api/placement/submit') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      if (!Array.isArray(payload.answers)) throw Object.assign(new Error('answers is required'), { statusCode: 400 });
      const language = payload.language === 'zh' ? 'zh' : 'en';
      return sendJson(response, 200, scorePlacement(language, payload.answers));
    }

    // ---- P0: sinh thẻ từ vựng ----
    if (request.method === 'POST' && pathname === '/api/vocab/card') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const term = typeof payload.term === 'string' ? payload.term.trim() : '';
      if (!term || term.length > 120) throw Object.assign(new Error('term is required'), { statusCode: 400 });
      const language = payload.language === 'zh' ? 'zh' : 'en';
      try {
        const card = await generateVocabCard(term, language);
        return sendJson(response, 200, { ...card, language });
      } catch (error) {
        if (error.code === 'NO_AI') return sendJson(response, 503, { error: 'NO_AI', code: 'NO_AI' });
        console.error('[vocab]', error.message);
        return sendJson(response, 502, { error: 'Không tạo được thẻ từ, thử lại sau.', code: 'AI_ERROR' });
      }
    }

    // ---- P1: feedback bài viết ----
    if (request.method === 'POST' && pathname === '/api/writing/feedback') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : 'Bài viết của bạn';
      if (!text || text.length > 1500) throw Object.assign(new Error('text is required (max 1500)'), { statusCode: 400 });
      const language = payload.language === 'zh' ? 'zh' : 'en';
      try {
        const fb = await writingFeedback({ text, prompt: prompt || 'Bài viết của bạn', language });
        return sendJson(response, 200, { ...fb, language });
      } catch (error) {
        if (error.code === 'NO_AI') return sendJson(response, 503, { error: 'NO_AI', code: 'NO_AI' });
        console.error('[writing]', error.message);
        return sendJson(response, 502, { error: 'Không chấm được bài, thử lại sau.', code: 'AI_ERROR' });
      }
    }

    // ---- P2: lượt roleplay ----
    if (request.method === 'POST' && pathname === '/api/roleplay/turn') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const scenario = payload.scenario && typeof payload.scenario === 'object' ? payload.scenario : null;
      if (!scenario || !scenario.title) throw Object.assign(new Error('scenario is required'), { statusCode: 400 });
      const language = payload.language === 'zh' ? 'zh' : 'en';
      const level = Math.min(7, Math.max(1, Number(payload.level) || 1));
      const history = Array.isArray(payload.history) ? payload.history.slice(-16) : [];
      try {
        const turn = await roleplayTurn({ scenario, language, level, history });
        return sendJson(response, 200, { ...turn, language, provider: turn.provider });
      } catch (error) {
        if (error.code === 'NO_AI') return sendJson(response, 503, { error: 'NO_AI', code: 'NO_AI' });
        console.error('[roleplay]', error.message);
        return sendJson(response, 502, { error: 'Không nối được hội thoại, thử lại sau.', code: 'AI_ERROR' });
      }
    }

    // ---- P2: nhận xét cuối cuộc gọi thoại ----
    if (request.method === 'POST' && pathname === '/api/roleplay/feedback') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const scenario = payload.scenario && typeof payload.scenario === 'object' ? payload.scenario : null;
      const language = payload.language === 'zh' ? 'zh' : 'en';
      const history = Array.isArray(payload.history) ? payload.history.slice(-20) : [];
      try {
        const fb = await roleplayFeedback({ scenario, language, history });
        return sendJson(response, 200, { ...fb, language, provider: fb.provider });
      } catch (error) {
        if (error.code === 'NO_AI') return sendJson(response, 503, { error: 'NO_AI', code: 'NO_AI' });
        console.error('[roleplay-fb]', error.message);
        return sendJson(response, 502, { error: 'Không chấm được cuộc gọi, thử lại sau.', code: 'AI_ERROR' });
      }
    }

    // ---- P3: sửa lỗi phát âm (so transcript STT với câu mục tiêu) ----
    if (request.method === 'POST' && pathname === '/api/pronunciation/feedback') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const target = typeof payload.target === 'string' ? payload.target.trim() : '';
      const heard = typeof payload.heard === 'string' ? payload.heard.trim() : '';
      if (!target || target.length > 300) throw Object.assign(new Error('target is required (max 300)'), { statusCode: 400 });
      if (!heard || heard.length > 300) throw Object.assign(new Error('heard is required (max 300)'), { statusCode: 400 });
      const language = payload.language === 'zh' ? 'zh' : 'en';
      const level = Math.min(7, Math.max(1, Number(payload.level) || 2));
      const ipa = typeof payload.ipa === 'string' ? payload.ipa.trim().slice(0, 300) : '';
      const diff = (Array.isArray(payload.diff) ? payload.diff : []).slice(0, 60).map((d) => {
        if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
        const word = typeof d.word === 'string' ? d.word.trim().slice(0, 60) : '';
        const heardAs = typeof d.heard === 'string' ? d.heard.trim().slice(0, 60) : '';
        const status = d.status === 'ok' || d.status === 'wrong' || d.status === 'missing' ? d.status : null;
        return word && status ? { word, heard: heardAs, status } : null;
      }).filter(Boolean);
      try {
        const fb = await pronunciationFeedback({ target, heard, language, level, diff, ipa });
        return sendJson(response, 200, { ...fb, language });
      } catch (error) {
        if (error.code === 'NO_AI') return sendJson(response, 503, { error: 'NO_AI', code: 'NO_AI' });
        console.error('[pron]', error.message);
        return sendJson(response, 502, { error: 'Không phân tích được phát âm, thử lại sau.', code: 'AI_ERROR' });
      }
    }

    // ---- Giáo viên đồng hành ----
    if (request.method === 'GET' && pathname === '/api/teacher/status') {
      const providers = configuredProviders();
      return sendJson(response, 200, {
        configured: providers.length > 0,
        active: providerOrder()[0] || null,
        providers
      });
    }

    if (request.method === 'POST' && pathname === '/api/teacher/chat') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const message = typeof payload.message === 'string' ? payload.message.trim() : '';
      if (!message) throw Object.assign(new Error('message is required'), { statusCode: 400 });
      if (message.length > 1200) throw Object.assign(new Error('message too long'), { statusCode: 400 });
      const language = payload.language === 'zh' ? 'zh' : 'en';
      const context = payload.context && typeof payload.context === 'object' ? payload.context : {};
      const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];

      // Nạp BỘ NHỚ DÀI HẠN của học viên để giáo viên luôn cá nhân hóa
      const learnerId = typeof payload.learnerId === 'string' && payload.learnerId ? payload.learnerId : 'default';
      let memory = null;
      try { memory = await loadMemory(learnerId); } catch {}
      const assistantProfile = normalizeTeacherProfile(payload.assistantProfile || memory?.teacherProfile || {});

      // Mô tả ngữ cảnh người học đang ở để giáo viên trả lời đúng hoàn cảnh
      const contextLines = Object.entries(context)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `- ${k}: ${String(v).slice(0, 200)}`);
      const memoryBlock = memory ? `BỘ NHỚ HỌC VIÊN (dùng để cá nhân hóa):\n${buildMemoryPrompt(memory)}\n` : '';
      const historyBlock = history.length
        ? `Hội thoại trước (giữ mạch hội thoại):\n${history.map((h) => `${h.role === 'user' ? 'Học viên' : 'Cô giáo'}: ${String(h.text || '').slice(0, 300)}`).join('\n')}\n\n`
        : '';
      const userPrompt = `Ngôn ngữ đang học: ${language === 'zh' ? 'tiếng Trung' : 'tiếng Anh'}.\n`
        + (memoryBlock ? `${memoryBlock}\n` : '')
        + historyBlock
        + `Ngữ cảnh hiện tại:\n${contextLines.length ? contextLines.join('\n') : '- (không có thông tin cụ thể)'}\n\n`
        + `Tin nhắn học viên: ${message}`;

      try {
        const result = await runTeacher({ system: teacherSystem(assistantProfile), user: userPrompt });
        // ghi nhận hoạt động mới nhất vào bộ nhớ
        if (memory) {
          try { await saveMemory(learnerId, { lastActivity: message.slice(0, 200) }); } catch {}
        }
        return sendJson(response, 200, {
          reply: result.text,
          provider: result.provider,
          model: result.model,
          language,
          assistantProfile
        });
      } catch (error) {
        if (error.code === 'NO_AI') {
          return sendJson(response, 503, {
            error: 'Giáo viên AI chưa được cấu hình. Thêm DEEPSEEK_API_KEY (hoặc GEMINI/OPENAI) vào lingovoice/.env rồi khởi động lại server.',
            code: 'NO_AI'
          });
        }
        console.error('[teacher]', error.message);
        return sendJson(response, 502, { error: 'Giáo viên AI hiện không trả lời được, thử lại sau.', code: 'AI_ERROR' });
      }
    }

    // ---- Bộ nhớ dài hạn ----
    if (request.method === 'GET' && pathname === '/api/memory') {
      const session = store ? await resolveSession(store, request) : null;
      if (session) return sendJson(response, 200, await loadMemoryFromStore(store, session.user));
      const learnerId = new URL(request.url, 'http://x').searchParams.get('learner') || 'default';
      return sendJson(response, 200, await loadMemory(learnerId));
    }

    if (request.method === 'POST' && pathname === '/api/memory') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const learnerId = typeof payload.learnerId === 'string' && payload.learnerId ? payload.learnerId : 'default';
      const patch = payload.patch && typeof payload.patch === 'object' ? payload.patch : {};
      const session = store ? await resolveSession(store, request) : null;
      if (session) return sendJson(response, 200, await saveMemoryToStore(store, session.user, patch));
      return sendJson(response, 200, await saveMemory(learnerId, patch));
    }

    if (request.method === 'POST' && pathname === '/api/memory/note') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const learnerId = typeof payload.learnerId === 'string' && payload.learnerId ? payload.learnerId : 'default';
      const note = typeof payload.note === 'string' ? payload.note.trim() : '';
      if (!note) throw Object.assign(new Error('note is required'), { statusCode: 400 });
      const session = store ? await resolveSession(store, request) : null;
      if (session) return sendJson(response, 200, await saveMemoryToStore(store, session.user, { notes: [{ text: note }] }));
      const mem = await addMemoryNote(learnerId, note);
      return sendJson(response, 200, mem);
    }

    // ---- Dữ liệu từ vựng đã chuẩn bị (data/vocab-{lang}.json) ----
    if (request.method === 'GET' && (pathname === '/data/vocab-en.json' || pathname === '/data/vocab-zh.json')) {
      const lang = pathname.endsWith('-zh.json') ? 'zh' : 'en';
      const filePath = join(ROOT, 'data', `vocab-${lang}.json`);
      const content = await readFile(filePath); // ENOENT -> 404
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(content);
      return;
    }

    // ---- Static ----
    const requested = normalize(pathname === '/' ? '/index.html' : pathname === '/admin' ? '/admin/index.html' : pathname);
    const safePath = normalize(join(PUBLIC, requested));
    if (!safePath.startsWith(PUBLIC)) throw new Error('forbidden');
    const content = await readFile(safePath);
    response.writeHead(200, {
      'Content-Type': MIME[extname(safePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(content);
  } catch (error) {
    if (error.message === 'forbidden') return response.writeHead(403).end();
    const status = error.code === 'ENOENT' ? 404 : (typeof error.statusCode === 'number' ? error.statusCode : 500);
    if (status >= 500) console.error(`[error] ${request.method} ${request.url} -> ${error.message}`);
    sendJson(response, status, error.code
      ? { error: error.message, code: error.code }
      : {
          error: status === 503
            ? 'Local voice is currently unavailable. Switching to text/browser mode.'
            : error.message
        });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`LingoVoice listening on http://${HOST}:${PORT}`);
  console.log(`Access protection: ${ACCESS_PASSWORD ? `enabled (${ACCESS_USER})` : 'disabled'}`);
  console.log(`Admin protection: ${ADMIN_PASSWORD ? `enabled (${ADMIN_USER})` : 'loopback only'}`);
  console.log(`PostgreSQL: ${store ? 'đã kết nối' : 'CHƯA cấu hình (DATABASE_URL) — tính năng tài khoản/đồng bộ tắt'}`);
  console.log(`OpenVox API: ${OPENVOX_API}`);
  const providers = configuredProviders();
  if (providers.length) {
    console.log(`AI teacher: ready (${providerOrder().join(' -> ')})`);
  } else {
    console.log('AI teacher: CHƯA cấu hình. Để bật giáo viên AI, thêm vào lingovoice/.env một trong:');
    console.log('  DEEPSEEK_API_KEY=sk-...  |  GEMINI_API_KEY=...  |  OPENAI_API_KEY=...  rồi khởi động lại.');
  }
  // Control plane chịu trách nhiệm pre-generation. Chỉ tự chạy khi chủ động bật.
  if (process.env.PREGEN_ON_START === '1' && process.env.PREGEN_DISABLED !== '1' && process.env.NODE_ENV !== 'test') {
    pregenAll({ silent: false })
      .then((r) => console.log(`[pregen] ${r.total} đoạn · mới ${r.generated} · có sẵn ${r.cached} · lỗi ${r.failed}`))
      .catch((e) => console.error('[pregen] thất bại:', e.message));
  }
});
