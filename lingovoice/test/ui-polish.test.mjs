// Test các cải tiến UI theo review 2026-08 (docs/ui-review-2026-08.md mục B)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const shell = await readFile(new URL('../public/lv-shell.js', import.meta.url), 'utf8');

test('B4 — skip-link tới nội dung chính (WCAG 2.4.1)', () => {
  assert.match(html, /<a class="skip-link" href="#main-content">Tới nội dung chính<\/a>/);
  assert.match(html, /<main class="container" id="main-content" tabindex="-1">/);
  assert.match(css, /\.skip-link:focus \{ top: 0;/);
});

test('B1 — dock Cô Linh có nút thu gọn/mở rộng + CSS chế độ min', () => {
  assert.match(html, /id="teacherMin"[^>]*aria-expanded="true"[^>]*aria-label="Thu gọn khung trò chuyện"/);
  assert.match(app, /panel\.classList\.toggle\('min'\)/);
  assert.match(app, /'Mở rộng khung trò chuyện'/);
  assert.match(css, /\.teacher-panel\.min \.teacher-chat[\s\S]*?display: none/);
  assert.match(css, /\.teacher-panel\.min \.teacher-min svg \{ transform: rotate\(180deg\)/);
});

test('B2 — dock không lộ tên provider AI cho người học', () => {
  assert.match(app, /Giáo viên AI sẵn sàng/);
  assert.doesNotMatch(app, /`AI: \$\{s\.active\}`/);
});

test('B3 — dải điều hướng section tab Thiết lập trỏ đúng 4 mục', () => {
  assert.match(html, /<nav class="setup-sections" aria-label="Phần trong mục thiết lập">/);
  for (const id of ['profileCard', 'placementBox', 'accountCard', 'teacherCustomCard']) {
    assert.match(html, new RegExp(`data-target="${id}"`));
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(shell, /chip\.dataset\.target/);
  assert.match(shell, /scrollIntoView\(\{ behavior: 'smooth'/);
});

test('B5 — onboarding hỏi độ tuổi trước ô tên', () => {
  const step1 = html.slice(html.indexOf('id="wgStep1"'), html.indexOf('id="wgNext1"'));
  const agePos = step1.indexOf('onboardAgePicker');
  const namePos = step1.indexOf('onboardName');
  assert.ok(agePos > -1 && namePos > -1, 'thiếu fieldset độ tuổi hoặc ô tên');
  assert.ok(agePos < namePos, 'độ tuổi phải đứng trước ô tên');
});

test('B6 — chọn giao diện sáng/tối: markup + wiring + token dark', () => {
  assert.match(html, /id="themeSeg"[^>]*>[\s\S]*data-theme-opt="system"[\s\S]*data-theme-opt="light"[\s\S]*data-theme-opt="dark"/);
  assert.match(shell, /lv-theme/);
  assert.match(shell, /prefers-color-scheme: dark/);
  assert.match(shell, /documentElement\.dataset\.theme/);
  assert.match(css, /\[data-theme="dark"\] \.toast \{ color: var\(--background\); \}/);
  assert.match(css, /\[data-theme="dark"\] \.skeleton::after/);
});
