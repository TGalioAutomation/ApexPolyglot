// LingoVoice — Pre-generation audio cache
// Sinh TRƯỚC toàn bộ audio của bài nghe/đọc (thư viện câu, thẻ từ, bài đọc, quiz)
// để khi người dùng bấm "nghe" là phát ngay từ cache, không phải đợi gen.
// Chạy: node pregen.mjs  (hoặc tự động khi server khởi động)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { VoiceClient, speakWithCache, prepareCachedAudio, cachedAudioStats } from './voice.mjs';
import { publicQuestions } from './placement.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));

// Trích khối dữ liệu JS dạng literal từ file frontend (để nội dung chỉ có MỘT nguồn)
export function extractLiteral(filePath, startMarker, endMarker) {
  const src = readFileSync(filePath, 'utf8');
  const anchor = src.indexOf(startMarker);
  if (anchor < 0) throw new Error(`marker not found: ${startMarker} in ${filePath}`);
  const brace = src.indexOf('{', anchor); // bắt đầu object literal
  const end = endMarker ? src.indexOf(endMarker, brace) : src.length;
  if (brace < 0 || end < 0) throw new Error(`không tìm thấy khối dữ liệu: ${startMarker} in ${filePath}`);
  let chunk = src.slice(brace, end).trim().replace(/;+\s*$/, '');
  return eval(`(${chunk})`);
}

// Nội dung đã duyệt từ DB (CMS roadmap #2) — nguồn chính khi server có PostgreSQL
async function appendDbContent(store, jobs) {
  const lesson = await store.listContent('lessons', { status: 'reviewed' });
  for (const row of lesson.rows) {
    for (const item of lesson.items.filter((i) => i.lesson_id === row.id)) {
      const text = item.payload && item.payload.text;
      if (text) jobs.push({ lang: row.lang, text });
    }
  }
  const reading = await store.listContent('readings', { status: 'reviewed' });
  for (const row of reading.rows) {
    for (const para of String(row.body || '').split(/\n{2,}/)) {
      for (const line of para.split(/(?<=[。！？.!?])\s*/).filter(Boolean)) {
        if (line.trim()) jobs.push({ lang: row.lang, text: line.trim() });
      }
    }
  }
  const roleplay = await store.listContent('roleplay', { status: 'reviewed' });
  for (const row of roleplay.rows) {
    if (row.opening) jobs.push({ lang: row.lang, text: row.opening });
    for (const prompt of row.prompts || []) jobs.push({ lang: row.lang, text: String(prompt) });
  }
}

export async function collectContent({ store } = {}) {
  const appJs = join(ROOT, 'public', 'app.js');
  const learningJs = join(ROOT, 'public', 'learning.js');
  const jobs = []; // {lang, text}

  // Thư viện câu mẫu (LESSONS)
  const lessons = extractLiteral(appJs, 'const LESSONS = {', 'const LANG_LABEL');
  for (const [lang, topics] of Object.entries(lessons)) {
    for (const t of topics) for (const s of t.sentences) jobs.push({ lang, text: s.text });
  }

  // Thẻ từ vựng (VOCAB_BASE: từ + câu mẫu — từ cần audio để "Nghe từ" phát giọng chuẩn)
  const vocab = extractLiteral(learningJs, 'const VOCAB_BASE = {', 'const WORKPLACE_PACK');
  for (const [lang, items] of Object.entries(vocab)) {
    for (const it of items) {
      if (it.term) jobs.push({ lang, text: it.term });
      if (it.example) jobs.push({ lang, text: it.example });
    }
  }

  // Kho JSON đã chuẩn bị là nguồn dữ liệu chính khi có mặt.
  for (const lang of ['en', 'zh']) {
    try {
      const prepared = JSON.parse(readFileSync(join(ROOT, 'data', `vocab-${lang}.json`), 'utf8'));
      for (const item of prepared.items || []) {
        if (item.term) jobs.push({ lang, text: item.term });
        if (item.example) jobs.push({ lang, text: item.example });
      }
    } catch { /* giữ fallback nội tuyến khi file chưa tồn tại */ }
  }

  // Bài đọc (READING_TEXTS paragraphs — tách câu)
  const reading = extractLiteral(learningJs, 'const READING_TEXTS = {', '/* ================= STATE =================');
  for (const [lang, levels] of Object.entries(reading)) {
    for (const texts of Object.values(levels)) {
      for (const t of texts) {
        for (const para of t.paragraphs) {
          for (const line of para.split(/(?<=[。！？.!?])\s*/).filter(Boolean)) {
            if (line.trim()) jobs.push({ lang, text: line.trim() });
          }
        }
      }
    }
  }

  // Placement: câu nghe
  for (const lang of ['en', 'zh']) {
    for (const q of publicQuestions(lang)) {
      if (q.type === 'listening' && q.audioText) jobs.push({ lang, text: q.audioText });
    }
  }

  // DB sống -> gộp nội dung CMS đã duyệt (lỗi thì giữ nguồn literal)
  if (store) {
    try { await appendDbContent(store, jobs); } catch { /* DB lỗi: bỏ qua */ }
  }

  // Khử trùng
  const seen = new Set();
  return jobs.filter((j) => {
    const k = `${j.lang}|${j.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function pregenAll({ silent = false, voiceEn, voiceZh, speed, cacheOnly = false, onProgress, store } = {}) {
  const jobs = await collectContent({ store });
  const client = new VoiceClient();
  const log = silent ? () => {} : (msg) => console.log(msg);
  let generated = 0, cached = 0, failed = 0;
  log(`[pregen] ${jobs.length} đoạn audio cần đảm bảo (${ROOT})`);

  let warned = false;
  for (let i = 0; i < jobs.length; i++) {
    const { lang, text } = jobs[i];
    try {
      const request = {
        text,
        language: lang,
        voice: lang === 'zh' ? voiceZh : voiceEn,
        speed
      };
      const result = cacheOnly ? await prepareCachedAudio(request) : await speakWithCache(client, request);
      if (!result) throw new Error('audio chưa có trong cache');
      if (result.cached) cached += 1; else generated += 1;
      if (!silent && (i % 5 === 0 || i === jobs.length - 1)) {
        log(`[pregen] ${i + 1}/${jobs.length} ${lang} ${result.cached ? 'cache' : 'GENERATED'} "${text.slice(0, 40)}"`);
      }
    } catch (e) {
      failed += 1;
      if (!warned) { log(`[pregen] lỗi (bỏ qua tiếp): ${e.message}`); warned = true; }
    }
    if (onProgress) onProgress({ current: i + 1, total: jobs.length, generated, cached, failed, language: lang });
  }
  const stats = await cachedAudioStats();
  log(`[pregen] XONG: tổng ${jobs.length} · sinh mới ${generated} · đã có ${cached} · lỗi ${failed} · cache hiện ${stats.files} file (${(stats.bytes / 1024).toFixed(0)} KB)`);
  return { total: jobs.length, generated, cached, failed, files: stats.files, cacheOnly };
}

// Chạy độc lập: node pregen.mjs
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === join(process.cwd(), 'pregen.mjs');
if (process.argv[1] && process.argv[1].endsWith('pregen.mjs')) {
  const { initializeStore } = await import('./db/store.mjs');
  initializeStore({ migrate: false })
    .then((store) => pregenAll({ store }))
    .then((r) => process.exit(r.failed && r.total === r.failed ? 1 : 0))
    .catch(() => process.exit(1));
}
