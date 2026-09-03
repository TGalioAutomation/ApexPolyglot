// LingoVoice — Chuẩn hóa payload đồng bộ + map dữ liệu localStorage legacy (ADR-004)
// Thuần function, không chạm DB → unit test được mà không cần PostgreSQL.
// Hợp đồng payload: docs/data-model.md §2. Key legacy: public/learning.js (store.*) + app.js.

const LANGS = new Set(['en', 'zh']);
const SRS_STATES = new Set(['new', 'learning', 'difficult', 'review', 'mastered']);
const AGE_GROUPS = new Set(['preschool', 'child', 'teen', 'young-adult']);
const GOALS = new Set(['giao-tiep', 'cong-viec', 'du-lich', 'thi']);

function iso(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString(); // ms epoch legacy
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

// ---- payload mới (/api/sync/push) ----
export function normalizeSyncPayload(payload = {}) {
  const out = { srs: [], mistakes: [], profilePatch: {} };

  for (const raw of Array.isArray(payload.srs) ? payload.srs.slice(0, 2000) : []) {
    if (!raw || !LANGS.has(raw.lang) || typeof raw.term !== 'string' || !raw.term.trim()) continue;
    out.srs.push({
      lang: raw.lang,
      vocabId: typeof raw.vocabId === 'string' ? raw.vocabId.slice(0, 160) : null,
      term: raw.term.trim().slice(0, 160),
      meaning: typeof raw.meaning === 'string' ? raw.meaning.slice(0, 300) : '',
      state: SRS_STATES.has(raw.state) ? raw.state : 'learning',
      intervalMs: Number.isFinite(raw.intervalMs) ? Math.max(0, Math.round(raw.intervalMs)) : 0,
      dueAt: iso(raw.dueAt),
      reps: Number.isFinite(raw.reps) ? Math.max(0, Math.round(raw.reps)) : 0,
      consecutiveGood: Number.isFinite(raw.consecutiveGood) ? Math.max(0, Math.round(raw.consecutiveGood)) : 0,
      difficult: !!raw.difficult,
      mastered: !!raw.mastered,
      updatedAt: iso(raw.updatedAt) || new Date().toISOString()
    });
  }

  for (const raw of Array.isArray(payload.mistakes) ? payload.mistakes.slice(0, 2000) : []) {
    if (!raw || !LANGS.has(raw.lang) || typeof raw.pattern !== 'string' || !raw.pattern.trim()) continue;
    out.mistakes.push({
      lang: raw.lang,
      skill: typeof raw.skill === 'string' ? raw.skill.slice(0, 60) : '',
      pattern: raw.pattern.trim().slice(0, 300),
      correct: typeof raw.correct === 'string' ? raw.correct.slice(0, 300) : '',
      createdAt: iso(raw.createdAt) || new Date().toISOString()
    });
  }

  const profile = payload.profile && typeof payload.profile === 'object' ? payload.profile : {};
  const patch = {};
  if (Array.isArray(profile.goals)) patch.goals = profile.goals.filter((g) => GOALS.has(g));
  if (Number.isFinite(profile.dailyMinutes)) patch.dailyMinutes = profile.dailyMinutes;
  if (Number.isFinite(profile.enRatio)) patch.enRatio = profile.enRatio;
  else if (Number.isFinite(profile.splitEn)) patch.enRatio = profile.splitEn / 100; // legacy dùng 0-100
  if (Number.isFinite(profile.day)) patch.day = profile.day;
  if (payload.teacherProfile && typeof payload.teacherProfile === 'object') patch.teacherProfile = payload.teacherProfile;
  if (payload.progress && typeof payload.progress === 'object') patch.progress = payload.progress;
  if (profile.placement && typeof profile.placement === 'object') patch.placements = profile.placement;
  out.profilePatch = patch;
  return out;
}

// ---- payload legacy (/api/sync/import-local): key localStorage cũ ----
// lv-srs: { items: { en: { [vocabId]: { state, difficulty, dueAt(ms|null), lastGrade, reps } } } }
// lv-mistakes: [{ id, lang, skill, pattern, correct, status, at(ms) }]
// lv-profile: { displayName, goals, dailyMinutes, splitEn, ageGroup, placement{}, ... }
// lingovoice-progress: { known[], quiz{}, listened[] } — lưu vào progress JSONB
export function mapLegacyLocalState(legacy = {}) {
  const payload = { srs: [], mistakes: [] };
  const srs = legacy['lv-srs'] && typeof legacy['lv-srs'] === 'object' ? legacy['lv-srs'] : { items: {} };
  const items = srs.items && typeof srs.items === 'object' ? srs.items : {};
  for (const lang of ['en', 'zh']) {
    for (const [vocabId, it] of Object.entries(items[lang] || {})) {
      if (!it || typeof it !== 'object') continue;
      // legacy không có term riêng — vocabId chính là khóa ("en-a1-term"); server lưu vào vocab_id + term
      payload.srs.push({
        lang, vocabId, term: vocabId,
        meaning: '',
        state: SRS_STATES.has(it.state) ? it.state : 'learning',
        intervalMs: 0,
        dueAt: it.dueAt ? iso(it.dueAt) : null,
        reps: Number.isFinite(it.reps) ? it.reps : 0,
        consecutiveGood: 0,
        difficult: (Number(it.difficulty) || 0) >= 0.6,
        mastered: it.state === 'mastered',
        updatedAt: iso(it.updatedAt) || new Date().toISOString()
      });
    }
  }
  for (const m of Array.isArray(legacy['lv-mistakes']) ? legacy['lv-mistakes'].slice(0, 2000) : []) {
    if (!m || typeof m.pattern !== 'string' || !m.pattern.trim()) continue;
    payload.mistakes.push({
      lang: LANGS.has(m.lang) ? m.lang : 'en',
      skill: String(m.skill || '').slice(0, 60),
      pattern: m.pattern.trim().slice(0, 300),
      correct: String(m.correct || '').slice(0, 300),
      createdAt: iso(m.at) || new Date().toISOString()
    });
  }
  const profile = legacy['lv-profile'] && typeof legacy['lv-profile'] === 'object' ? legacy['lv-profile'] : {};
  payload.profile = {
    goals: Array.isArray(profile.goals) ? profile.goals : [],
    dailyMinutes: Number.isFinite(profile.dailyMinutes) ? profile.dailyMinutes : 25,
    splitEn: Number.isFinite(profile.splitEn) ? profile.splitEn : 60,
    ageGroup: AGE_GROUPS.has(profile.ageGroup) ? profile.ageGroup : undefined,
    placement: profile.placement && typeof profile.placement === 'object' ? profile.placement : {},
    journeyStartedAt: iso(profile.journeyStartedAt)
  };
  payload.teacherProfile = legacy['lv-teacher-profile'] && typeof legacy['lv-teacher-profile'] === 'object'
    ? legacy['lv-teacher-profile'] : null;
  payload.progress = legacy['lingovoice-progress'] && typeof legacy['lingovoice-progress'] === 'object'
    ? { legacyProgress: legacy['lingovoice-progress'] } : null;
  payload.days = legacy['lv-days'] && typeof legacy['lv-days'] === 'object' ? { days: legacy['lv-days'] } : null;
  payload.customVocab = legacy['lv-custom-vocab'] || null;
  payload.mined = legacy['lv-mined'] || null;
  return payload;
}

export function validAgeGroup(value) {
  return AGE_GROUPS.has(value) ? value : 'young-adult';
}

// Đăng ký mở cho ai tự đăng ký — chỉ learner và parent; teacher/admin cấp bằng DB thủ công.
const REGISTER_ROLES = new Set(['learner', 'parent']);
export function validRegisterRole(value) {
  return REGISTER_ROLES.has(value) ? value : 'learner';
}
