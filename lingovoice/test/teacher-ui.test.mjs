import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const [html, css, app, learning] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../public/learning.js', import.meta.url), 'utf8')
]);

test('teacher stage has an accessible 2D character and conversation structure', () => {
  assert.ok(root.endsWith('/lingovoice/'));
  assert.match(html, /id="coStage" data-state="idle"/);
  assert.match(html, /id="coStateLabel">Sẵn sàng trò chuyện/);
  assert.match(html, /class="co-wave" aria-hidden="true"/);
  assert.match(html, /id="qaChat"[^>]+aria-label="Nội dung trò chuyện"/);
});

test('teacher stage uses a responsive grid instead of the collapsing flex row', () => {
  assert.match(css, /\.co-stage\s*\{[^}]*display:\s*grid;/s);
  assert.match(css, /grid-template-columns:\s*160px minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*grid-template-columns:\s*100px minmax\(0, 1fr\)/);
  assert.doesNotMatch(css, /\.co-status\s*\{[^}]*width:\s*100%/s);
});

test('2D teacher exposes all visual conversation states', () => {
  for (const state of ['idle', 'listening', 'thinking', 'speaking', 'error']) {
    assert.match(app, new RegExp(`${state}:`));
  }
  assert.match(app, /function setCoLinhState/);
  assert.match(learning, /LV\.setCoLinhState\('listening'/);
  assert.match(learning, /LV\.setCoLinhState\('thinking'/);
  assert.match(learning, /LV\.setCoLinhState\('error'/);
});

test('teacher customization exposes personality, voice and persistence controls', () => {
  assert.match(html, /id="teacherCustomCard"/);
  assert.match(html, /name="teacherPersonality" value="warm"/);
  assert.match(html, /name="teacherPersonality" value="strict"/);
  assert.match(html, /name="teacherPersonality" value="energetic"/);
  assert.match(html, /id="teacherVoiceEn"/);
  assert.match(html, /id="teacherVoiceZh"/);
  assert.match(html, /id="teacherVoicePreview"/);
  assert.match(app, /TEACHER_PROFILE_KEY = 'lv-teacher-profile'/);
  assert.match(learning, /assistantProfile: LV\.getTeacherProfile\(\)/);
  assert.match(learning, /patch: \{ teacherProfile: profile \}/);
});

test('Writing Studio exposes progress, accessible modes and recoverable feedback', () => {
  assert.match(html, /class="card writing-studio"/);
  assert.match(html, /id="writingProgressBar"/);
  assert.match(html, /id="writingModes" role="tablist"/);
  assert.match(html, /id="writingFeedback"[^>]+aria-live="polite"[^>]+tabindex="-1"/);
  assert.match(learning, /WritingCore\.compareText/);
  assert.match(learning, /Hoàn tác/);
  assert.match(learning, /completeWritingItem/);
  assert.doesNotMatch(learning, /Bấm "Kiểm tra" không được/);
});
