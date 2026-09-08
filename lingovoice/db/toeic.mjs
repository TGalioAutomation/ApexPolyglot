// LingoVoice — Thi thử TOEIC cuối buổi: chuẩn hoá payload + gộp lịch sử (thuần function).
// Không chạm DB → unit test không cần PostgreSQL, như db/gamification.mjs.
// Hợp đồng: docs/api-spec.md §3b. Lưu kết quả: learning_sessions (skill='toeic') + attempts.
import { utcDayKey, shiftDayKey } from './gamification.mjs';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DURATION_SET = new Set([10, 15, 30]);
export const TOEIC_FORMS = 50;
export const TOEIC_MAX_QUESTIONS = 100;

// ---- Chuẩn hoá POST /api/toeic/submit ----
// attempts là nguồn chân lý của điểm: mỗi câu một lượt (chưa chọn = correct:false).
// Kéo lệch kiểu /api/activity (clamp im lặng) vì đây là kết quả thi — sai shape thì loại bớt,
// server tự tính lại total/correct/byKind, không tin số client tự khai.
export function normalizeToeicSubmit(payload = {}, { todayKey = utcDayKey() } = {}) {
  const day = typeof payload.day === 'string' && DAY_RE.test(payload.day)
    && payload.day >= shiftDayKey(todayKey, -400) && payload.day <= shiftDayKey(todayKey, 1)
    ? payload.day
    : todayKey;
  const form = Math.min(TOEIC_FORMS, Math.max(1, Math.round(Number(payload.form) || 1)));
  const durationMin = DURATION_SET.has(Number(payload.durationMin)) ? Number(payload.durationMin) : 10;
  const usedSec = Math.max(0, Math.min(3 * 3600, Math.round(Number(payload.usedSec) || 0)));
  const attempts = [];
  for (const raw of Array.isArray(payload.attempts) ? payload.attempts.slice(0, TOEIC_MAX_QUESTIONS) : []) {
    if (!raw || typeof raw !== 'object') continue;
    attempts.push({
      kind: ['vocab', 'reading', 'listening'].includes(raw.kind) ? raw.kind : 'vocab',
      itemRef: typeof raw.itemRef === 'string' ? raw.itemRef.slice(0, 160) : null,
      correct: raw.correct === true,
      lang: 'en'
    });
  }
  return { day, form, durationMin, usedSec, attempts };
}

export function byKindFromAttempts(attempts = []) {
  const byKind = { vocab: { total: 0, correct: 0 }, reading: { total: 0, correct: 0 }, listening: { total: 0, correct: 0 } };
  for (const a of attempts) {
    const bucket = byKind[a.kind] || byKind.vocab;
    bucket.total += 1;
    if (a.correct === true) bucket.correct += 1;
  }
  return byKind;
}

export function scoreOf(correct, total) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// ---- Gộp lịch sử thành báo cáo kỹ năng tích lũy (GET /api/toeic/history) ----
// rows: learning_sessions WHERE skill='toeic', mới nhất trước (DESC).
export function aggregateToeicHistory(rows = [], { recentWindow = 5 } = {}) {
  const history = [];
  const skills = { vocab: { total: 0, correct: 0 }, reading: { total: 0, correct: 0 }, listening: { total: 0, correct: 0 } };
  let minutes = 0;
  let scoreSum = 0;
  let bestScore = 0;
  for (const row of rows) {
    const s = row.stats || {};
    const total = Number(s.total) || 0;
    const correct = Number(s.correct) || 0;
    history.push({
      id: row.id,
      at: row.started_at,
      form: Number(s.form) || 1,
      durationMin: Number(s.durationMin) || 10,
      usedSec: Number(s.usedSec) || 0,
      total,
      correct,
      score: Number(s.score) || scoreOf(correct, total),
      byKind: s.byKind || {}
    });
    minutes += Math.round((Number(s.usedSec) || 0) / 60);
    scoreSum += Number(s.score) || scoreOf(correct, total);
    bestScore = Math.max(bestScore, Number(s.score) || 0);
    for (const kind of Object.keys(skills)) {
      const bucket = (s.byKind || {})[kind];
      if (bucket) {
        skills[kind].total += Number(bucket.total) || 0;
        skills[kind].correct += Number(bucket.correct) || 0;
      }
    }
  }
  const recent = history.slice(0, recentWindow);
  const older = history.slice(recentWindow);
  const avg = (list) => (list.length ? Math.round(list.reduce((a, h) => a + h.score, 0) / list.length) : null);
  return {
    history,
    skills,
    stats: {
      tests: history.length,
      avgScore: history.length ? Math.round(scoreSum / history.length) : 0,
      bestScore,
      minutes,
      recentAvgScore: avg(recent),
      previousAvgScore: avg(older)
    }
  };
}
