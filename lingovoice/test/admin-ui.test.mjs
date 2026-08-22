import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, js, server, app] = await Promise.all([
  readFile(new URL('../public/admin/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/admin/admin.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/admin/admin.js', import.meta.url), 'utf8'),
  readFile(new URL('../server.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8')
]);

test('dashboard có đủ khu vận hành chính và semantic truy cập được', () => {
  for (const id of ['serviceList', 'runPregen', 'runAudit', 'runVocabPrep', 'jobList', 'vocabRows']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /[🚀⚙️📊🔊]/u);
});

test('dashboard responsive chuyển bảng thành card và giữ target chạm', () => {
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /td::before \{ content: attr\(data-label\)/);
  assert.match(css, /\.button \{[^}]*min-height: 44px/s);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('job UI có loading, polling có điều kiện và phản hồi lỗi', () => {
  assert.match(js, /button\.disabled = true/);
  assert.match(js, /aria-busy/);
  assert.match(js, /document\.hidden/);
  assert.match(js, /setTimeout\(loadJobs, 1500\)/);
  assert.match(js, /status === 409/);
});

test('learner client chỉ gọi prepared audio', () => {
  assert.match(app, /fetch\('\/api\/voice\/prepared'/);
  assert.doesNotMatch(app, /fetch\('\/api\/voice\/speak\/stream'/);
  assert.match(server, /AUDIO_NOT_PREPARED/);
  assert.match(server, /deliveryMode: 'prepared-only'/);
});
