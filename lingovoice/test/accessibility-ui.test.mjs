import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const learning = await readFile(new URL('../public/learning.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');

test('modal chi tiết từ và placement có semantics, nhãn và focus lifecycle', () => {
  assert.match(html, /id="vsDetail"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="vsDetailKind"/);
  // nút đóng phải thấy được trên modal nền sáng (màu trắng gốc của .teacher-close bị chìm)
  assert.match(css, /\.modal \.teacher-close\s*\{[^}]+var\(--foreground\)/);
  assert.match(html, /id="placementModal"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="placeTitle"/);
  assert.match(html, /id="placeOpenAnswer"[^>]*aria-label="Câu trả lời bài kiểm tra đầu vào"/);
  assert.match(learning, /function openModal\(/);
  assert.match(learning, /function closeModal\(/);
  assert.match(learning, /function handleModalKeydown\(/);
  assert.match(learning, /event\.key === 'Escape'/);
});

test('onboarding giữ focus trong bước đang hiển thị và công bố đúng dialog', () => {
  assert.match(html, /id="onboardModal"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="onboardDialogTitle"/);
  assert.match(html, /id="onboardDialogTitle">Thiết lập hồ sơ học tập/);
  assert.match(html, /id="wgStep1"[\s\S]*?<h2 tabindex="-1">/);
  assert.match(learning, /openModal\(document\.getElementById\('onboardModal'\), '#onboardName'\)/);
  assert.match(learning, /closeModal\(document\.getElementById\('onboardModal'\)\)/);
  assert.match(learning, /!element\.closest\('\[hidden\], \[aria-hidden="true"\]'\)/);
  assert.match(learning, /document\.querySelector\(`#wgStep\$\{n\} h2`\)\?\.focus\(\)/);
});

test('onboarding có asset Cô Linh tối ưu cho mobile và alt text', () => {
  assert.match(html, /class="onboard-character"[^>]*src="\/assets\/co-linh-guide\.webp"/);
  assert.match(html, /class="onboard-character"[^>]*loading="lazy"[^>]*decoding="async"/);
  assert.match(html, /class="onboard-character"[^>]*alt="Cô Linh cầm sách/);
  assert.match(css, /\.onboard-character \{[^}]*object-fit: contain/);
});

test('kho từ và thư viện đọc dùng button native cho thao tác bàn phím', () => {
  assert.match(learning, /document\.createElement\('button'\); row\.type = 'button'; row\.className = 'review-item vs-bank-item'/);
  assert.match(learning, /document\.createElement\('button'\); open\.type = 'button'; open\.className = 'read-card'/);
  assert.match(learning, /document\.createElement\('button'\); w\.type = 'button'; w\.className = 'read-word'/);
  assert.match(css, /\.read-card \{[^}]*width: 100%/);
});

test('bài đọc tiếng Anh render lại dấu câu sau nút từ vựng', () => {
  assert.match(learning, /if \(tk\.punct\) span\.append\(document\.createTextNode\(tk\.punct\)\)/);
});
