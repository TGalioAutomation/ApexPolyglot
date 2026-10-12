import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, learning] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/learning.js', import.meta.url), 'utf8')
]);

test('CEFR path frames levels as learning guidance, not certification', () => {
  assert.match(html, /CEFR · KHUNG THAM CHIẾU/);
  assert.match(html, /Bạn cần học gì ở mỗi cấp\?/);
  assert.match(learning, /CEFR ở đây là khung tham chiếu học tập, không phải chứng chỉ/);
  assert.doesNotMatch(learning, /để đạt <b>\$\{next\.code\}/);
});

test('all six CEFR levels define concrete learning requirements', () => {
  for (const code of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    assert.match(learning, new RegExp(`code: '${code}'`));
  }
  assert.equal((learning.match(/topics: \[/g) || []).length, 6);
  assert.equal((learning.match(/structures: \[/g) || []).length, 6);
  assert.equal((learning.match(/skills: \[/g) || []).length, 6);
  assert.equal((learning.match(/outcome:/g) || []).length, 6);
  assert.match(learning, /Chủ đề & từ vựng/);
  assert.match(learning, /Cấu trúc trọng tâm/);
  assert.match(learning, /Kỹ năng cần làm/);
  assert.match(learning, /Đầu ra cần đạt/);
});

test('CEFR cards expose progress semantics and responsive learning columns', () => {
  assert.match(learning, /setAttribute\('role', 'progressbar'\)/);
  assert.match(learning, /aria-valuenow/);
  assert.match(css, /\.cefr-learning-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.cefr-learning-grid\s*\{\s*grid-template-columns:\s*1fr;/);
});
