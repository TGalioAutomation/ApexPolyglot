// LingoVoice — Bộ nhớ dài hạn của giáo viên AI
// Store server-side (data/learner-memory.json) theo từng học viên: mục tiêu,
// placement level, điểm yếu, tiến độ SRS, từ đã học, lỗi sai, ghi chú.
// Mọi request chat của giáo viên tự nạp bộ nhớ này để luôn cá nhân hóa.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = join(ROOT, 'data');
const MEMORY_FILE = join(DATA_DIR, 'learner-memory.json');

const DEFAULT_MEMORY = {
  learnerId: 'default',
  profile: { goals: [], dailyMinutes: 25, splitEn: 60, startedAt: null },
  placement: { en: null, zh: null },
  progress: { en: { learned: 0, due: 0, mistakes: 0 }, zh: { learned: 0, due: 0, mistakes: 0 } },
  weakSkills: { en: null, zh: null },
  recentLearned: [],
  recentMistakes: [],
  notes: [],
  teacherProfile: { personality: 'warm', voices: { en: 'F4', zh: 'zf_xiaoxiao' }, speed: 0.9 },
  day: 1,
  updatedAt: null
};

let cache = null; // cache trong bộ nhớ để tránh đọc đĩa mỗi lần

function deepMerge(base, patch) {
  if (patch === undefined) return base;
  if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
    if (!base || typeof base !== 'object' || Array.isArray(base)) base = {};
    for (const k of Object.keys(patch)) {
      if (patch[k] !== undefined) base[k] = deepMerge(base[k], patch[k]);
    }
    return base;
  }
  return patch;
}

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(MEMORY_FILE)) await writeFile(MEMORY_FILE, JSON.stringify({ default: DEFAULT_MEMORY }, null, 2));
}

export async function loadMemory(learnerId = 'default') {
  await ensureFile();
  if (!cache) {
    try { cache = JSON.parse(await readFile(MEMORY_FILE, 'utf8')); } catch { cache = {}; }
  }
  const base = cache[learnerId] || { ...DEFAULT_MEMORY, learnerId };
  cache[learnerId] = base;
  return base;
}

export async function saveMemory(learnerId = 'default', patch = {}) {
  await ensureFile();
  if (!cache) {
    try { cache = JSON.parse(await readFile(MEMORY_FILE, 'utf8')); } catch { cache = {}; }
  }
  const current = cache[learnerId] || { ...DEFAULT_MEMORY, learnerId };
  const merged = deepMerge(current, patch);
  merged.updatedAt = new Date().toISOString();
  cache[learnerId] = merged;
  await writeFile(MEMORY_FILE, JSON.stringify(cache, null, 2));
  return merged;
}

export async function addMemoryNote(learnerId = 'default', text) {
  const note = { text: String(text || '').trim().slice(0, 500), at: new Date().toISOString() };
  if (!note.text) return null;
  const mem = await loadMemory(learnerId);
  mem.notes = [...(mem.notes || []), note].slice(-50);
  return saveMemory(learnerId, mem);
}

const GOAL_LABEL = { 'giao-tiep': 'giao tiếp', 'cong-viec': 'công việc', 'du-lich': 'du lịch', 'thi': 'thi cử' };

// Tạo tóm tắt bộ nhớ học viên để nạp vào prompt của giáo viên
export function buildMemoryPrompt(mem) {
  const lines = [];
  const goals = (mem.profile?.goals || []).map((g) => GOAL_LABEL[g] || g);
  lines.push(`- Mục tiêu: ${goals.length ? goals.join(', ') : '(chưa đặt)'}`);
  lines.push(`- Lịch: ${mem.profile?.dailyMinutes || 25} phút/ngày · tỷ lệ Anh/Trung ${mem.profile?.splitEn || 60}/${100 - (mem.profile?.splitEn || 60)}`);
  for (const lang of ['en', 'zh']) {
    const pl = mem.placement?.[lang];
    if (pl) {
      lines.push(`- ${lang.toUpperCase()}: Level ${pl.level} (tổng ${pl.overall}/100), yếu nhất ${pl.weakest}`);
      lines.push(`  - ${lang.toUpperCase()} đã học ${mem.progress?.[lang]?.learned || 0} cụm, đang ${mem.progress?.[lang]?.due || 0} cụm cần ôn, ${mem.progress?.[lang]?.mistakes || 0} lỗi cần sửa`);
    } else {
      lines.push(`- ${lang.toUpperCase()}: chưa làm placement`);
    }
  }
  const recent = (mem.recentLearned || []).slice(-4);
  if (recent.length) lines.push(`- Mới học gần đây: ${recent.map((r) => `"${r.term}"`).join(', ')}`);
  const errs = (mem.recentMistakes || []).slice(-3);
  if (errs.length) lines.push(`- Lỗi gần đây: ${errs.map((e) => `[${e.skill}] ${e.pattern}`).join(' | ')}`);
  if (mem.notes?.length) lines.push(`- Ghi chú của cô giáo: ${mem.notes.slice(-2).map((n) => n.text).join(' / ')}`);
  lines.push(`- Ngày học hiện tại: ${mem.day || 1}/90`);
  return lines.join('\n');
}

export async function memoryStats() {
  await ensureFile();
  return { file: MEMORY_FILE, exists: existsSync(MEMORY_FILE) };
}
