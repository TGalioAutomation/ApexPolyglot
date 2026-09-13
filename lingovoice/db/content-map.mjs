// LingoVoice — Ánh xạ nội dung học (roadmap #2): payload frontend ↔ hàng DB + validate input CMS.
// Thuần logic, không phụ thuộc pg — dùng chung cho server routes, seed, AI draft và test.
export const CONTENT_TYPES = ['lessons', 'readings', 'roleplay'];

export function validLang(value) {
  return value === 'en' || value === 'zh' ? value : null;
}

function str(value, max) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean && clean.length <= max ? clean : null;
}

function optStr(value, max) {
  const clean = str(value, max);
  return clean === null ? '' : clean;
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'x';
}

// id ổn định cho hàng nội dung mới: <prefix>-<lang>-<slug>; caller tự đảm bảo unique (thử lại với suffix)
export function buildContentId(type, lang, base) {
  const prefix = type === 'readings' ? 'r' : type === 'roleplay' ? 'rp' : 'l';
  return `${prefix}-${lang}-${slugify(base)}`;
}

// ---- Validate input CMS (tạo tay / sửa / AI draft) — trả {ok, value} hoặc {ok:false, error} ----

export function validateLessonInput(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'LESSON_INVALID' };
  const topic = str(input.topic, 120);
  if (!topic) return { ok: false, error: 'TOPIC_REQUIRED' };
  const sentences = Array.isArray(input.sentences) ? input.sentences : null;
  if (!sentences || sentences.length < 1 || sentences.length > 12) return { ok: false, error: 'SENTENCES_INVALID' };
  const clean = [];
  for (const s of sentences) {
    if (!s || typeof s !== 'object') return { ok: false, error: 'SENTENCE_INVALID' };
    const text = str(s.text, 300);
    const vi = str(s.vi, 300);
    if (!text || !vi) return { ok: false, error: 'SENTENCE_INVALID' };
    const pinyin = optStr(s.pinyin, 200);
    if (pinyin.length && !/^[\p{L}\p{M}\d\s,.!?·:']+$/u.test(pinyin)) return { ok: false, error: 'PINYIN_INVALID' };
    const id = s.id ? str(s.id, 120) : null;
    clean.push(id ? { id, text, vi, pinyin } : { text, vi, pinyin });
  }
  return { ok: true, value: { topic, sentences: clean } };
}

export function validateReadingInput(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'READING_INVALID' };
  const title = str(input.title, 200);
  if (!title) return { ok: false, error: 'TITLE_REQUIRED' };
  const level = Number(input.level);
  if (!Number.isInteger(level) || level < 1 || level > 7) return { ok: false, error: 'LEVEL_INVALID' };
  const paragraphs = Array.isArray(input.paragraphs) ? input.paragraphs : null;
  if (!paragraphs || paragraphs.length < 1 || paragraphs.length > 8) return { ok: false, error: 'PARAGRAPHS_INVALID' };
  const cleanParas = [];
  for (const p of paragraphs) {
    const text = str(p, 1200);
    if (!text) return { ok: false, error: 'PARAGRAPH_INVALID' };
    cleanParas.push(text);
  }
  const questions = Array.isArray(input.questions) ? input.questions : [];
  if (questions.length > 10) return { ok: false, error: 'QUESTIONS_INVALID' };
  const cleanQs = [];
  for (const q of questions) {
    if (!q || typeof q !== 'object') return { ok: false, error: 'QUESTION_INVALID' };
    const text = str(q.q, 300);
    if (!text) return { ok: false, error: 'QUESTION_INVALID' };
    const options = Array.isArray(q.options) ? q.options : null;
    if (!options || options.length < 2 || options.length > 4) return { ok: false, error: 'OPTIONS_INVALID' };
    const cleanOptions = options.map((o) => str(o, 200));
    if (cleanOptions.some((o) => !o)) return { ok: false, error: 'OPTIONS_INVALID' };
    const answer = Number(q.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return { ok: false, error: 'ANSWER_INVALID' };
    cleanQs.push({ q: text, options: cleanOptions, answer });
  }
  return { ok: true, value: { title, level, paragraphs: cleanParas, questions: cleanQs } };
}

export function validateRoleplayInput(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'ROLEPLAY_INVALID' };
  const title = str(input.title, 120);
  if (!title) return { ok: false, error: 'TITLE_REQUIRED' };
  const vi = str(input.vi, 160);
  if (!vi) return { ok: false, error: 'VI_TITLE_REQUIRED' };
  const persona = optStr(input.persona, 400);
  const opening = optStr(input.opening, 400);
  const promptsRaw = Array.isArray(input.prompts) ? input.prompts : [];
  if (promptsRaw.length > 12) return { ok: false, error: 'PROMPTS_INVALID' };
  const prompts = [];
  for (const p of promptsRaw) {
    const text = str(p, 300);
    if (!text) return { ok: false, error: 'PROMPT_INVALID' };
    prompts.push(text);
  }
  return { ok: true, value: { title, vi, persona, opening, prompts } };
}

export function validateContentInput(type, input) {
  if (type === 'lessons') return validateLessonInput(input);
  if (type === 'readings') return validateReadingInput(input);
  return validateRoleplayInput(input);
}

// ---- Hàng DB -> shape API learner (mirror literal frontend) ----

export function lessonRowsToApi(rows, items) {
  const byLesson = new Map();
  for (const item of items) {
    if (!byLesson.has(item.lesson_id)) byLesson.set(item.lesson_id, []);
    byLesson.get(item.lesson_id).push(item);
  }
  return rows
    .map((row) => {
      const list = (byLesson.get(row.id) || []).sort((a, b) => a.order_index - b.order_index);
      return {
        topic: row.title,
        sentences: list.map((item) => {
          const p = item.payload || {};
          const s = { id: p.id || item.id, text: p.text || '' };
          if (p.vi) s.vi = p.vi;
          if (p.pinyin) s.pinyin = p.pinyin;
          return s;
        })
      };
    })
    .filter((t) => t.sentences.length > 0);
}

export function readingRowsToApi(rows) {
  const levels = {};
  for (const row of rows) {
    const meta = row.metadata || {};
    const key = String(row.level);
    if (!levels[key]) levels[key] = [];
    levels[key].push({
      id: row.id,
      level: Number(row.level),
      title: row.title,
      paragraphs: String(row.body || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
      questions: Array.isArray(meta.questions) ? meta.questions : []
    });
  }
  return levels;
}

export function roleplayRowsToApi(rows) {
  return rows.map((row) => ({ id: row.id, title: row.title, vi: row.vi_title || row.title }));
}

// ---- Hàng DB -> item admin (danh sách CMS) ----

export function rowToAdminItem(type, row, extras = {}) {
  const base = {
    id: row.id,
    lang: row.lang,
    status: row.status,
    provider: row.provider || null,
    model: row.model || null,
    updatedAt: row.updated_at
  };
  if (type === 'lessons') {
    return { ...base, topic: row.title, stage: row.stage, orderIndex: row.order_index, sentences: extras.sentences || [] };
  }
  if (type === 'readings') {
    const meta = row.metadata || {};
    return {
      ...base, title: row.title, level: Number(row.level),
      paragraphs: String(row.body || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
      questions: Array.isArray(meta.questions) ? meta.questions : []
    };
  }
  return { ...base, title: row.title, vi: row.vi_title || '', persona: row.persona || '', opening: row.opening || '', prompts: Array.isArray(row.prompts) ? row.prompts : [] };
}
