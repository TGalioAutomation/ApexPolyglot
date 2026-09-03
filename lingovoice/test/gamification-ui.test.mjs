// Test UI gamification + phụ huynh (roadmap #4) — regex trên source như các *-ui test khác
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const shell = await readFile(new URL('../public/lv-shell.js', import.meta.url), 'utf8');
const api = await readFile(new URL('../public/lv-api.js', import.meta.url), 'utf8');
const learning = await readFile(new URL('../public/learning.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
const apiSpec = await readFile(new URL('../docs/api-spec.md', import.meta.url), 'utf8');

test('Card Đà học tập có XP, cấp độ, thanh level và dải huy hiệu', () => {
  assert.match(html, /id="xpTotalVal"/);
  assert.match(html, /id="levelName"/);
  assert.match(html, /id="levelBarFill"/);
  assert.match(html, /id="badgeRow"/);
  assert.match(css, /\.badge-row \{/);
  assert.match(css, /\.badge\.earned \{/);
  assert.match(css, /\.badge\.locked \{/);
  assert.match(css, /\.level-track span \{/);
});

test('lv-shell: queue attempt + logActivity + render gamification', () => {
  assert.match(shell, /function queueAttempt/);
  assert.match(shell, /function logActivity/);
  assert.match(shell, /LVApi\.activity\(/);
  assert.match(shell, /LVApi\.summary\(/);
  assert.match(shell, /function applyGamification/);
  assert.match(shell, /Huy hiệu mới/);
  assert.match(shell, /window\.LVShell = \{[\s\S]*logActivity[\s\S]*queueAttempt/);
  // renderHabits (learning.js) phải ưu tiên số server khi đã đăng nhập
  assert.match(shell, /function serverHabitStats/);
  assert.match(shell, /habitStats: serverHabitStats/);
  assert.match(learning, /window\.LVShell\.habitStats && window\.LVShell\.habitStats\(\)\) \|\| habitStats\(\)/);
});

test('learning.js/app.js: ghi nhận activity và attempt đúng kỹ năng', () => {
  // export cho app.js (trước đây no-op thầm)
  assert.match(learning, /window\.srsRecord = srsRecord/);
  assert.match(learning, /window\.recordActivity = recordActivity/);
  // recordActivity đẩy rollup lên server
  assert.match(learning, /LVShell\.logActivity\(\{ minutes/);
  // srsRecord queue attempt; studio vocab + đọc tra từ + nghe quiz gắn kind riêng
  assert.match(learning, /function srsRecord\(id, lang, grade, kind = 'vocab'\)/);
  assert.match(learning, /LVShell\.queueAttempt\(\{ kind, itemRef: id/);
  assert.match(learning, /kind: 'vocab', itemRef: cur\.id/);
  assert.match(learning, /srsRecord\(id, lang, 3, 'reading'\)/);
  assert.match(app, /srsRecord\(s\.id, language, 3, 'listening'\)/);
});

test('lv-api: đủ method gamification + phụ huynh', () => {
  for (const path of ['/api/activity', '/api/gamification/summary', '/api/parent/invite',
    '/api/parent/children', '/api/parent/link', '/api/parent/links']) {
    assert.ok(api.includes(path), `thiếu ${path}`);
  }
});

test('Card phụ huynh: 2 vai + mã mời + modal dashboard', () => {
  assert.match(html, /id="parentCard"/);
  assert.match(html, /data-target="parentCard">Phụ huynh</);
  assert.match(html, /id="parentRoleBox"/);
  assert.match(html, /id="childLinkBox"/);
  assert.match(html, /id="parentInviteBtn"/);
  assert.match(html, /id="parentInviteCode"/);
  assert.match(html, /id="parentLinkCode"/);
  assert.match(html, /id="parentDashModal"/);
  assert.match(html, /id="pdSuggestions"/);
  assert.match(css, /\.parent-child \{/);
  assert.match(css, /\.invite-code \{/);
});

test('docs/api-spec.md có hợp đồng gamification + phụ huynh', () => {
  assert.match(apiSpec, /Gamification & phụ huynh/);
  assert.match(apiSpec, /\/api\/activity/);
  assert.match(apiSpec, /ROLE_REQUIRED/);
  assert.match(apiSpec, /INVITE_CODE_INVALID/);
});
