import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditFile } from '../scripts/audit-vocab.mjs';

const [en, zh, html, learning] = await Promise.all([
  auditFile(new URL('../data/vocab-en.json', import.meta.url), 'en'),
  auditFile(new URL('../data/vocab-zh.json', import.meta.url), 'zh'),
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/learning.js', import.meta.url), 'utf8')
]);

test('prepared vocabulary datasets pass schema and uniqueness audit', () => {
  assert.deepEqual(en.errors, []);
  assert.deepEqual(zh.errors, []);
  assert.equal(en.total, 150);
  assert.equal(zh.total, 40);
  assert.deepEqual(en.levels, { A1: 30, A2: 50, B1: 62, B2: 8, C1: 0, C2: 0 });
  assert.deepEqual(zh.levels, { A1: 15, A2: 14, B1: 10, B2: 1, C1: 0, C2: 0 });
});

test('Vocabulary Studio exposes dataset coverage before the list', () => {
  assert.match(html, /id="vsDataCoverage"/);
  assert.ok(html.indexOf('id="vsDataCoverage"') < html.indexOf('id="vsBankList"'));
  assert.match(html, /id="vsCefrFilter"/);
  assert.match(html, /id="vsBankCount"/);
  assert.match(learning, /Nguồn dữ liệu đang sử dụng/);
  assert.match(learning, /Human-reviewed:/);
});

test('prepared JSON is primary and inline vocabulary is fallback only', () => {
  assert.match(learning, /vocabDataState\[lang\]\.status === 'ready'[\s\S]*extVocab\[lang\]/);
  assert.match(learning, /status === 'error' \? fallbackVocab\(lang\) : \[\]/);
  assert.match(learning, /Chỉ render danh sách sau khi đã biết chính xác trạng thái dataset/);
  assert.match(learning, /Xem \$\{available\} từ \$\{l\.code\} đang có/);
});
