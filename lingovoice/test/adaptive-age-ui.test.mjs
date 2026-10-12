import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, app, learning, android] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../public/learning.js', import.meta.url), 'utf8'),
  readFile(new URL('../android/app/src/main/java/com/lingovoice/app/MainActivity.java', import.meta.url), 'utf8')
]);

test('hồ sơ và onboarding cung cấp đủ bốn nhóm tuổi', () => {
  for (const mode of ['preschool', 'child', 'teen', 'young-adult']) {
    assert.match(html, new RegExp(`value="${mode}"`));
    assert.match(learning, new RegExp(mode.replace('-', '\\-')));
    assert.match(css, new RegExp(`data-learner-mode="${mode}"`));
  }
  assert.match(html, /id="profileAgePicker"/);
  assert.match(html, /id="onboardAgePicker"/);
});

test('nhóm tuổi được lưu vào hồ sơ và áp dụng lên body', () => {
  assert.match(learning, /ageGroup: 'young-adult'/);
  assert.match(learning, /updateJourneyStage\(p, selectedLearnerMode\('profileAgePicker'\)\)/);
  assert.match(learning, /updateJourneyStage\(p, selectedLearnerMode\('onboardAgePicker'\)\)/);
  assert.match(learning, /document\.body\.dataset\.learnerMode = mode/);
  assert.match(html, /id="planNextGoLabel">Bắt đầu ngay/);
  assert.match(learning, /actionLabel\.textContent = config\.primaryAction/);
});

test('một hồ sơ học tập được giữ xuyên suốt bốn giai đoạn', () => {
  assert.match(html, /id="journeyProfile"/);
  assert.match(html, /id="lifeStageRail"/);
  assert.match(html, /Một bạn học · một tiến trình không bị mất/);
  assert.match(html, /id="profileName"[^>]*autocomplete="name"/);
  assert.match(learning, /journeyStartedAt: null, stageHistory: \[\]/);
  assert.match(learning, /function updateJourneyStage\(/);
  assert.match(learning, /profile\.stageHistory\.push\(\{ stage: normalized, startedAt: today \}\)/);
  assert.match(learning, /profile: \{ displayName: p\.displayName, ageGroup: p\.ageGroup, stageHistory: p\.stageHistory/);
});

test('nội dung và màu nhấn thay đổi theo giai đoạn thay vì chỉ phóng to UI', () => {
  assert.match(learning, /preschool:[\s\S]*allowedGoals: \['giao-tiep', 'du-lich'\]/);
  assert.match(learning, /mode === 'preschool'[\s\S]*Nghe và nhại lại/);
  assert.match(learning, /mode === 'child'[\s\S]*Từ và câu hôm nay/);
  assert.match(learning, /young-adult'[\s\S]*Học 3 cụm dùng được ngay/);
  assert.match(css, /preschool"\]\s*\{[^}]*--stage-accent:\s*#D97706/s);
  assert.match(css, /child"\]\s*\{[^}]*--stage-accent:\s*#0284C7/s);
  assert.match(css, /teen"\]\s*\{[^}]*--stage-accent:\s*#7C3AED/s);
  assert.match(css, /young-adult"\]\s*\{[^}]*--stage-accent:\s*#0F766E/s);
});

test('target chạm mobile tăng theo tuổi và vẫn có phản hồi nhấn', () => {
  assert.match(css, /preschool"\]\s*\{[^}]*--touch-target:\s*56px/s);
  assert.match(css, /child"\]\s*\{[^}]*--touch-target:\s*52px/s);
  assert.match(css, /\.btn[^}]*min-height:\s*var\(--touch-target\)/s);
  assert.match(css, /button:active:not\(:disabled\)/);
  assert.match(css, /touch-action:\s*manipulation/);
});

test('Android Back ưu tiên đóng lớp giao diện đang mở', () => {
  assert.match(app, /window\.handleLingoVoiceBack/);
  assert.match(app, /if \(teacherState\.open\)/);
  assert.match(android, /window\.handleLingoVoiceBack/);
  assert.match(android, /if \("true"\.equals\(handled\)\) return/);
  assert.match(android, /WindowInsetsCompat\.Type\.systemBars\(\)/);
});
