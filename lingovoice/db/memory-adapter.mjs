// LingoVoice — Bộ nhớ giáo viên cho learner CÓ TÀI KHOẢN (đọc/ghi qua Store PG).
// Giữ đúng shape của memory.mjs (DEFAULT_MEMORY) để buildMemoryPrompt dùng lại nguyên vẹn.
// Learner nặc danh (chưa đăng nhập) vẫn đi đường JSON file cũ trong memory.mjs.
import { loadMemory as legacyLoad } from '../memory.mjs';

const DEFAULT_TEACHER_PROFILE = { personality: 'warm', voices: { en: 'F4', zh: 'zf_xiaoxiao' }, speed: 0.9 };

function isoOrNull(value) { return value ? new Date(value).toISOString() : null; }

export async function loadMemoryFromStore(store, user) {
  const [profileRow, notesRows, mistakeRows, srsRows] = await Promise.all([
    store.getProfile(user.id),
    store.listMemoryNotes(user.id),
    store.listMistakes(user.id, 20),
    store.listSrsItems(user.id)
  ]);
  const placements = {
    en: await store.latestPlacement(user.id, 'en'),
    zh: await store.latestPlacement(user.id, 'zh')
  };
  const profile = profileRow || {};
  const extra = profile.extra || {};
  const teacher = profile.teacher_profile && Object.keys(profile.teacher_profile).length
    ? profile.teacher_profile : DEFAULT_TEACHER_PROFILE;
  const recentLearned = srsRows.slice(0, 12).map((s) => ({ term: s.term, lang: s.lang }));
  return {
    learnerId: user.username,
    profile: {
      goals: profile.goals || [],
      dailyMinutes: profile.daily_minutes ?? 25,
      splitEn: Math.round(Number(profile.en_ratio ?? 0.7) * 100),
      startedAt: isoOrNull(profile.journey_started_at)
    },
    placement: {
      en: placements.en ? { level: placements.en.level, overall: placements.en.overall, skills: placements.en.skills, weakest: placements.en.weakest } : null,
      zh: placements.zh ? { level: placements.zh.level, overall: placements.zh.overall, skills: placements.zh.skills, weakest: placements.zh.weakest } : null
    },
    progress: profile.progress && typeof profile.progress === 'object' && profile.progress.en
      ? profile.progress
      : { en: { learned: 0, due: 0, mistakes: 0 }, zh: { learned: 0, due: 0, mistakes: 0 } },
    weakSkills: extra.weakSkills || { en: null, zh: null },
    recentLearned,
    recentMistakes: mistakeRows.map((m) => ({ skill: m.skill, pattern: m.pattern, correct: m.correct, lang: m.lang })),
    notes: notesRows.map((n) => ({ text: n.note, at: isoOrNull(n.created_at) })),
    teacherProfile: teacher,
    day: profile.day ?? 1,
    updatedAt: isoOrNull(profile.updated_at)
  };
}

// patch theo shape memory.mjs → ghi vào các cột profile/placements/notes
export async function saveMemoryToStore(store, user, patch = {}) {
  const profilePatch = {};
  const legacy = patch.profile && typeof patch.profile === 'object' ? patch.profile : {};
  if (Array.isArray(legacy.goals)) profilePatch.goals = legacy.goals;
  if (Number.isFinite(legacy.dailyMinutes)) profilePatch.dailyMinutes = legacy.dailyMinutes;
  if (Number.isFinite(legacy.splitEn)) profilePatch.enRatio = legacy.splitEn / 100;
  if (legacy.startedAt) profilePatch.journeyStartedAt = legacy.startedAt;
  if (patch.teacherProfile && typeof patch.teacherProfile === 'object') profilePatch.teacherProfile = patch.teacherProfile;
  if (patch.progress && typeof patch.progress === 'object') profilePatch.progress = patch.progress;
  if (Number.isFinite(patch.day)) profilePatch.day = patch.day;
  for (const key of ['weakSkills', 'recentLearned', 'stageHistory']) {
    if (patch[key] !== undefined) profilePatch[key] = patch[key]; // đi vào extra
  }
  if (Object.keys(profilePatch).length) await store.patchProfile(user.id, profilePatch);

  const placement = patch.placement && typeof patch.placement === 'object' ? patch.placement : {};
  for (const lang of ['en', 'zh']) {
    const p = placement[lang];
    if (p && Number.isFinite(p.level)) {
      await store.insertPlacement({ userId: user.id, lang, level: p.level, overall: Number.isFinite(p.overall) ? p.overall : null, skills: p.skills || {}, weakest: p.weakest || null });
    }
  }
  if (Array.isArray(patch.notes)) {
    for (const n of patch.notes.slice(-50)) {
      if (n && typeof n.text === 'string' && n.text.trim()) await store.addMemoryNote(user.id, n.text);
    }
  }
  return loadMemoryFromStore(store, user);
}

// Hỗ trợ route /api/sync: pull trả shape sync chuẩn từ PG
export async function buildSyncSnapshot(store, user) {
  const [srs, mistakes, profileRow] = await Promise.all([
    store.listSrsItems(user.id),
    store.listMistakes(user.id, 500),
    store.getProfile(user.id)
  ]);
  const profile = profileRow || {};
  return {
    srs,
    mistakes: mistakes.map((m) => ({ lang: m.lang, skill: m.skill, pattern: m.pattern, correct: m.correct, createdAt: isoOrNull(m.created_at) })),
    profile: {
      goals: profile.goals || [],
      dailyMinutes: profile.daily_minutes ?? 15,
      enRatio: Number(profile.en_ratio ?? 0.7),
      day: profile.day ?? 1
    },
    teacherProfile: profile.teacher_profile && Object.keys(profile.teacher_profile).length ? profile.teacher_profile : null,
    progress: profile.progress || { en: { learned: 0, due: 0, mistakes: 0 }, zh: { learned: 0, due: 0, mistakes: 0 } },
    placements: {
      en: await store.latestPlacement(user.id, 'en'),
      zh: await store.latestPlacement(user.id, 'zh')
    }
  };
}

// re-export để server import một chỗ
export { legacyLoad };
