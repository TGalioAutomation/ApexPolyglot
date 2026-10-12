// LingoVoice — prep-vocab: chuẩn bị dữ liệu từ vựng (batch + kiểm tra chất lượng + xuất JSON)
// Cách dùng:
//   node scripts/prep-vocab.mjs --lang en [--limit 50] [--dry-run]
//   node scripts/prep-vocab.mjs --lang zh --terms data/terms-zh.txt
// Đọc danh sách từ từ data/terms-{lang}.txt, mỗi dòng: term|topic|workplace(yes/no)|freq(1-5)|cefr
// Hint chuẩn (freq/workplace/cefr/topic) ghi đè giá trị AI sinh ra — theo đúng chiến lược tần suất.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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

const { generateVocabCard } = await import('../ai.mjs');

// Slug cho id ổn định (không đổi giữa các lần chạy)
function slug(term) {
  return String(term || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '') || 'w';
}

function parseArgs(argv) {  const args = { lang: 'en', terms: null, limit: Infinity, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lang') args.lang = argv[++i];
    else if (a === '--terms') args.terms = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]) || Infinity;
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

function readTerms(file) {
  if (!existsSync(file)) { console.error(`Không tìm thấy ${file}`); process.exit(1); }
  return readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .filter((l) => !l.startsWith('#'))
    .map((line) => {
      const [term, topic, workplace, freq, cefr] = line.split('|').map((s) => s.trim());
      if (!term) return null;
      return {
        term,
        topic: topic || undefined,
        workplace: workplace === 'yes' ? true : workplace === 'no' ? false : undefined,
        freq: freq ? Number(freq) : undefined,
        cefr: cefr || undefined
      };
    }).filter(Boolean);
}

// Kiểm tra chất lượng tự động (log cảnh báo; không chặn trừ khi thiếu nghĩa/ví dụ)
function qualityChecks(item, lang) {
  const warn = [];
  const isZh = lang === 'zh';
  if (!item.meaning || !item.example || !item.translation) return { ok: false, warn: ['thiếu meaning/example/translation'] };
  if (isZh) {
    if (!item.pinyin) warn.push('thiếu pinyin');
  } else {
    if (!item.ipa || !item.ipa.includes('ˈ')) warn.push('IPA thiếu trọng âm');
    if (!item.pos) warn.push('thiếu pos');
    if (!Array.isArray(item.collocations) || item.collocations.length < 1) warn.push('thiếu collocations');
  }
  const f = Number(item.freq);
  if (!Number.isInteger(f) || f < 1 || f > 5) warn.push('freq không hợp lệ');
  // độ dài ví dụ theo CEFR (ước lượng)
  const words = item.example.trim().split(/\s+/).length;
  const limits = { A1: 6, A2: 9, B1: 13, B2: 17, C1: 22, C2: 30 };
  const c = item.cefr || 'B1';
  if (limits[c] && words > limits[c]) warn.push(`ví dụ hơi dài cho ${c} (${words} từ)`);
  return { ok: true, warn };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const lang = args.lang === 'zh' ? 'zh' : 'en';
  const termsFile = args.terms || join(ROOT, 'data', `terms-${lang}.txt`);
  const terms = readTerms(termsFile).slice(0, args.limit);
  if (!terms.length) { console.error('Danh sách trống.'); process.exit(1); }
  console.log(`[prep] ${lang} — ${terms.length} term (limit ${args.limit})`);

  const outPath = join(ROOT, 'data', `vocab-${lang}.json`);
  const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')).items || [] : [];
  const seen = new Set(existing.map((i) => (i.term || '').toLowerCase()));
  const items = [...existing];
  let created = 0, failed = 0, warnings = 0;

  for (let i = 0; i < terms.length; i++) {
    const t = terms[i];
    const key = t.term.toLowerCase();
    if (seen.has(key)) { console.log(`  skip (trùng): ${t.term}`); continue; }
    try {
      const card = await generateVocabCard(t.term, lang);
      // hint chuẩn ghi đè (tần suất/công việc/CEFR/chủ đề theo danh sách tham chiếu)
      const item = {
        ...card,
        id: `${lang}-${(t.cefr || 'b1').toLowerCase()}-${slug(t.term)}`,
        topic: t.topic || card.topic,
        workplace: t.workplace !== undefined ? t.workplace : Boolean(card.workplace),
        freq: t.freq || card.freq,
        cefr: t.cefr || 'B1'
      };
      const q = qualityChecks(item, lang);
      if (!q.ok) { failed += 1; console.log(`  FAIL ${t.term}: ${q.warn.join('; ')}`); continue; }
      if (q.warn.length) { warnings += 1; console.log(`  warn ${t.term}: ${q.warn.join('; ')}`); }
      items.push(item);
      seen.add(key);
      created += 1;
      console.log(`  [${i + 1}/${terms.length}] ${t.term} (freq ${item.freq}, workplace ${item.workplace}, ${item.cefr})`);
    } catch (e) {
      failed += 1;
      console.log(`  ERR ${t.term}: ${e.message}`);
    }
  }

  if (!args.dryRun) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify({ version: 1, lang, updatedAt: new Date().toISOString(), items }, null, 2));
    console.log(`[prep] Đã ghi ${outPath} — tổng ${items.length} mục`);
  } else {
    console.log(`[prep] DRY-RUN — chưa ghi. Dự kiến tổng ${items.length} mục`);
  }
  console.log(`[prep] XONG: tạo mới ${created} · lỗi ${failed} · cảnh báo ${warnings}`);
  process.exit(failed && created === 0 ? 1 : 0);
}

main();
