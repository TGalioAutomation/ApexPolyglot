// LingoVoice — seed-content: nạp nội dung gốc (literal trong frontend) vào DB (roadmap #2).
// Idempotent: upsert theo id, chạy lại không nhân bản. Trạng thái nạp vào: reviewed.
// Chạy: node scripts/seed-content.mjs   (cần DATABASE_URL; tự chạy migration)
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';

// Nạp .env (giống server)
const ENV_PATH = join(ROOT, '.env');
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || Object.hasOwn(process.env, m[1])) continue;
    process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

const { extractLiteral } = await import('../pregen.mjs');
const { initializeStore } = await import('../db/store.mjs');
const { buildContentId } = await import('../db/content-map.mjs');

// Trích mảng literal (extractLiteral của pregen chỉ xử lý object `{`)
function extractArrayLiteral(filePath, startMarker, endMarker) {
  const src = readFileSync(filePath, 'utf8');
  const anchor = src.indexOf(startMarker);
  if (anchor < 0) throw new Error(`marker not found: ${startMarker} in ${filePath}`);
  const bracket = src.indexOf('[', anchor);
  const end = endMarker ? src.indexOf(endMarker, bracket) : src.length;
  if (bracket < 0 || end < 0) throw new Error(`không tìm thấy khối mảng: ${startMarker} in ${filePath}`);
  const chunk = src.slice(bracket, end).trim().replace(/;+\s*$/, '');
  return eval(`(${chunk})`);
}

// Literal frontend -> danh sách upsert (thuần logic, test được không cần DB)
export function buildSeedRows() {
  const appJs = join(ROOT, 'public', 'app.js');
  const learningJs = join(ROOT, 'public', 'learning.js');
  const rows = { lessons: [], readings: [], roleplay: [] };

  const lessons = extractLiteral(appJs, 'const LESSONS = {', 'const LANG_LABEL');
  for (const [lang, topics] of Object.entries(lessons)) {
    topics.forEach((t) => {
      rows.lessons.push({
        id: buildContentId('lessons', lang, t.topic),
        lang,
        topic: t.topic,
        sentences: t.sentences.map((s) => {
          const item = { id: s.id, text: s.text, vi: s.vi };
          if (s.pinyin) item.pinyin = s.pinyin;
          return item;
        })
      });
    });
  }

  const readings = extractLiteral(learningJs, 'const READING_TEXTS = {', '/* ================= STATE =================');
  for (const [lang, levels] of Object.entries(readings)) {
    for (const [level, texts] of Object.entries(levels)) {
      for (const t of texts) {
        rows.readings.push({ id: t.id, lang, level: Number(level), title: t.title, paragraphs: t.paragraphs, questions: t.questions });
      }
    }
  }

  const roleplay = extractArrayLiteral(learningJs, 'const ROLEPLAY_SCENARIOS = [', 'const READING_TEXTS');
  for (const s of roleplay) {
    rows.roleplay.push({ id: s.id, lang: 'en', title: s.title, vi: s.vi, persona: '', opening: '', prompts: [] });
  }
  return rows;
}

export async function seedContent(store, { logger = console } = {}) {
  const rows = buildSeedRows();
  const stats = {};
  for (const type of ['lessons', 'readings', 'roleplay']) {
    let count = 0;
    for (const row of rows[type]) {
      await store.upsertContent(type, { ...row, status: 'reviewed' });
      count += 1;
    }
    stats[type] = count;
  }
  logger.log(`[seed-content] lessons ${stats.lessons} · readings ${stats.readings} · roleplay ${stats.roleplay} (reviewed)`);
  return stats;
}

// CLI
if (process.argv[1] && process.argv[1].endsWith('seed-content.mjs')) {
  const store = await initializeStore({}); // migrate:true mặc định — bảo đảm schema mới nhất
  if (!store) {
    console.error('Thiếu DATABASE_URL hoặc PostgreSQL chưa bật.');
    process.exit(1);
  }
  try {
    await seedContent(store);
    process.exit(0);
  } catch (error) {
    console.error('[seed-content] lỗi:', error.message);
    process.exit(1);
  }
}
