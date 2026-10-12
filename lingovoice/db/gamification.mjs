// LingoVoice — Gamification thuần function (roadmap #4): XP, streak, cấp độ, huy hiệu,
// mã mời phụ huynh, gợi ý đồng hành. Không chạm DB → unit test được như db/sync.mjs.
// Hợp đồng payload: docs/api-spec.md §2. Bảng lưu: db/migrations/006_gamification.sql.

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ATTEMPT_KINDS = new Set(['vocab', 'listening', 'writing', 'speaking', 'reading', 'quiz']);

export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// ---- Chuẩn hóa payload POST /api/activity ----
// day do CLIENT gửi (múi giờ người học có thể trước UTC tối đa ~14h → cho phép +1 ngày);
// server chặn ngày quá cũ và tương lai xa.
export function normalizeActivityPayload(payload = {}, { todayKey = utcDayKey() } = {}) {
  const day = typeof payload.day === 'string' && DAY_RE.test(payload.day)
    && payload.day >= shiftDayKey(todayKey, -400) && payload.day <= shiftDayKey(todayKey, 1)
    ? payload.day
    : todayKey;
  const clamp = (v, max) => (Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);
  const attempts = [];
  for (const raw of Array.isArray(payload.attempts) ? payload.attempts.slice(0, 200) : []) {
    if (!raw || typeof raw !== 'object') continue;
    attempts.push({
      kind: ATTEMPT_KINDS.has(raw.kind) ? raw.kind : 'vocab',
      itemRef: typeof raw.itemRef === 'string' ? raw.itemRef.slice(0, 160) : null,
      correct: typeof raw.correct === 'boolean' ? raw.correct : null,
      grade: Number.isFinite(raw.grade) ? Math.max(1, Math.min(5, Math.round(raw.grade))) : null,
      lang: raw.lang === 'zh' ? 'zh' : raw.lang === 'en' ? 'en' : null
    });
  }
  return {
    day,
    minutes: clamp(payload.minutes, 240),
    words: clamp(payload.words, 500),
    attempts
  };
}

export function shiftDayKey(dayKey, deltaDays) {
  const d = new Date(`${dayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// ---- XP: nỗ lực cũng được thưởng, đúng được thưởng nhiều ----
export const XP_RULES = { correctAttempt: 10, wrongAttempt: 2, word: 3, minute: 1, maxMinuteXp: 60 };

export function xpForActivity({ minutes = 0, words = 0, attempts = [] } = {}) {
  const correct = attempts.filter((a) => a.correct === true).length;
  const wrong = attempts.filter((a) => a.correct === false).length;
  return correct * XP_RULES.correctAttempt
    + wrong * XP_RULES.wrongAttempt
    + words * XP_RULES.word
    + Math.min(minutes, XP_RULES.maxMinuteXp) * XP_RULES.minute;
}

// ---- Streak từ tập khóa ngày 'YYYY-MM-DD' ----
export function computeStreaks(dayKeys, todayKey = utcDayKey()) {
  const days = new Set(dayKeys);
  // current: cho phép hôm nay chưa học — vẫn tính nếu hôm qua có
  let cursor = days.has(todayKey) ? todayKey : shiftDayKey(todayKey, -1);
  let current = 0;
  while (days.has(cursor)) { current += 1; cursor = shiftDayKey(cursor, -1); }
  // longest: chạy liên tiếp dài nhất
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const day of sorted) {
    run = prev !== null && shiftDayKey(prev, 1) === day ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }
  return { current, longest };
}

// ---- Cấp độ theo tổng XP (checkpoint cách đều theo mật độ tăng dần) ----
export const LEVELS = [
  { xp: 0, name: 'Hạt giống' },
  { xp: 100, name: 'Mầm non' },
  { xp: 300, name: 'Chồi xanh' },
  { xp: 600, name: 'Cây nhỏ' },
  { xp: 1000, name: 'Cây vững' },
  { xp: 2000, name: 'Cây cổ thụ' },
  { xp: 3500, name: 'Khu rừng nhỏ' }
];

export function levelOf(totalXp = 0) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (totalXp >= LEVELS[i].xp) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  return {
    level: index + 1,
    name: current.name,
    xp: totalXp,
    currentLevelXp: current.xp,
    nextLevelXp: next ? next.xp : null,
    progress: next ? Math.max(0, Math.min(1, (totalXp - current.xp) / (next.xp - current.xp))) : 1
  };
}

// ---- Huy hiệu: định nghĩa là code, DB chỉ lưu cái đã đạt ----
export const BADGES = [
  { id: 'first-day', icon: '🌱', name: 'Ngày đầu tiên', desc: 'Hoàn thành ngày học đầu tiên.', test: (s) => s.daysActive >= 1 },
  { id: 'words-10', icon: '📖', name: '10 từ đầu tiên', desc: 'Học 10 từ vựng.', test: (s) => s.srsTotal >= 10 },
  { id: 'words-50', icon: '📚', name: '50 từ vựng', desc: 'Học 50 từ vựng.', test: (s) => s.srsTotal >= 50 },
  { id: 'streak-7', icon: '🔥', name: '7 ngày liền', desc: 'Học 7 ngày liên tiếp.', test: (s) => s.streak >= 7 },
  { id: 'streak-30', icon: '⚡', name: '30 ngày liền', desc: 'Học 30 ngày liên tiếp.', test: (s) => s.streak >= 30 },
  { id: 'correct-50', icon: '🎯', name: '50 lượt đúng', desc: 'Trả lời đúng 50 lượt luyện tập.', test: (s) => s.totalCorrect >= 50 },
  { id: 'xp-500', icon: '⭐', name: '500 XP', desc: 'Giành 500 XP.', test: (s) => s.totalXp >= 500 },
  { id: 'master-10', icon: '🏆', name: '10 từ thành thạo', desc: '10 từ đạt mức thành thạo.', test: (s) => s.srsMastered >= 10 }
];

// Trả về các badge vừa MỚI đạt (chưa nằm trong earnedIds) — server lưu vào earned_badges
export function newlyEarnedBadges(stats, earnedIds = new Set()) {
  return BADGES.filter((b) => !earnedIds.has(b.id) && b.test(stats));
}

// Gom stats dùng cho badge từ dữ liệu store
export function badgeStats({ activityRows = [], streak, srsTotal = 0, srsMastered = 0 }) {
  return {
    daysActive: activityRows.length,
    streak,
    srsTotal,
    srsMastered,
    totalCorrect: activityRows.reduce((a, r) => a + (r.correct || 0), 0),
    totalXp: activityRows.reduce((a, r) => a + (r.xp || 0), 0)
  };
}

// ---- Mã mời phụ huynh: bỏ ký tự dễ nhầm (0/O, 1/I/L); randomInt từ node:crypto
// để mã không đoán được (node:crypto không phá tính thuần của các hàm khác).
import { randomInt } from 'node:crypto';

const INVITE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function newInviteCode() {
  let code = '';
  for (let i = 0; i < 8; i++) code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  return code;
}

export function validInviteCode(code) {
  return typeof code === 'string' && new RegExp(`^[${INVITE_ALPHABET}]{8}$`).test(code.trim().toUpperCase());
}

// ---- Gợi ý đồng hành cho phụ huynh (rule-based, không dùng AI) ----
export function parentSuggestions({ missedDays = 0, dueCount = 0, topMistakes = [], minutes7d = 0, dailyMinutes = 25, streak = 0 } = {}) {
  const out = [];
  if (missedDays >= 3) out.push(`Con nghỉ ${missedDays} ngày rồi — cùng con mở app 5 phút tối nay để giữ lại thói quen học.`);
  if (dueCount > 0) out.push(`Con có ${dueCount} từ đến hạn ôn — ngồi ôn cùng con khoảng 5 phút sẽ rất hiệu quả.`);
  if (topMistakes[0]) out.push(`Lỗi hay gặp: “${topMistakes[0].pattern}” — thử hỏi con câu này trong đoạn hội thoại tối nay.`);
  if (dailyMinutes > 0 && minutes7d < dailyMinutes * 3) out.push('Tuần này con học ít hơn mục tiêu — nới lịch học nhẹ hơn một chút cho vừa sức rồi tăng dần nhé.');
  if (streak >= 3) out.push(`Con đang có chuỗi ${streak} ngày học liền — một lời khen nhỏ sẽ tiếp thêm động lực!`);
  if (!out.length) out.push('Chưa có dữ liệu đủ để nhận xét — khuyến khích con học 5 phút mỗi ngày để thấy tiến bộ nhé.');
  return out.slice(0, 4);
}
