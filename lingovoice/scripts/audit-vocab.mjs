import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const REQUIRED = ['id', 'term', 'meaning', 'example', 'translation', 'cefr'];

export function auditItems(items, language) {
  const errors = [];
  const ids = new Set();
  const terms = new Set();
  const levels = Object.fromEntries(LEVELS.map((level) => [level, 0]));
  let reviewed = 0;
  items.forEach((item, index) => {
    for (const field of REQUIRED) if (!item?.[field]) errors.push(`${language}[${index}] thiếu ${field}`);
    if (item?.id && ids.has(item.id)) errors.push(`${language}[${index}] trùng id ${item.id}`);
    if (item?.id) ids.add(item.id);
    const term = String(item?.term || '').trim().toLocaleLowerCase(language === 'zh' ? 'zh-CN' : 'en-US');
    if (term && terms.has(term)) errors.push(`${language}[${index}] trùng term ${item.term}`);
    if (term) terms.add(term);
    if (!LEVELS.includes(item?.cefr)) errors.push(`${language}[${index}] CEFR không hợp lệ: ${item?.cefr}`);
    else levels[item.cefr] += 1;
    if (language === 'en' && (!item?.ipa || !item?.pos || !Array.isArray(item?.collocations))) errors.push(`en[${index}] thiếu IPA/POS/collocations`);
    if (language === 'zh' && !item?.pinyin) errors.push(`zh[${index}] thiếu pinyin`);
    if (item?.reviewed === true) reviewed += 1;
  });
  return { language, total: items.length, reviewed, levels, errors };
}

export async function auditFile(url, language) {
  const data = JSON.parse(await readFile(url, 'utf8'));
  if (!Array.isArray(data.items)) throw new Error(`${language}: items phải là array`);
  return auditItems(data.items, language);
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) {
  const reports = await Promise.all([
    auditFile(new URL('../data/vocab-en.json', import.meta.url), 'en'),
    auditFile(new URL('../data/vocab-zh.json', import.meta.url), 'zh')
  ]);
  for (const report of reports) {
    const coverage = LEVELS.map((level) => `${level}:${report.levels[level]}`).join(' ');
    console.log(`[vocab-data] ${report.language.toUpperCase()} total=${report.total} reviewed=${report.reviewed} ${coverage}`);
    report.errors.forEach((error) => console.error(`[vocab-data] ERROR ${error}`));
  }
  if (reports.some((report) => report.errors.length)) process.exitCode = 1;
}
