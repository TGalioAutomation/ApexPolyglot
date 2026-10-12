// Test UI: thẻ tài khoản + đồng bộ, empty/error/offline state, stage theming, script order
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const cssText = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
const shell = await readFile(new URL('../public/lv-shell.js', import.meta.url), 'utf8');
const api = await readFile(new URL('../public/lv-api.js', import.meta.url), 'utf8');

test('thẻ tài khoản & đồng bộ có form đăng nhập/đăng ký đầy đủ nhãn và nút', () => {
  assert.match(html, /id="accountCard"/);
  assert.match(html, /id="accountForm"/);
  assert.match(html, /<label class="account-field"><span>Tên đăng nhập<\/span>/);
  assert.match(html, /id="accountPass"[^>]*type="password"[^>]*minlength="8"/);
  assert.match(html, /id="registerBtn"[^>]*type="submit">Tạo tài khoản mới</);
  assert.match(html, /id="accountStatus"[^>]*role="status"/);
  assert.match(html, /id="accountMessage"[^>]*aria-live="polite"/);
  // Khi đã đăng nhập: đồng bộ / nhập legacy / đăng xuất
  assert.match(html, /id="accountLoggedIn"[^>]*hidden/);
  assert.match(html, /id="syncNow"/);
  assert.match(html, /id="importLocalBtn"/);
  assert.match(html, /id="logoutBtn"/);
});

test('5 asset minh họa được dùng đúng chỗ với alt/aria phù hợp', () => {
  // splash: favicon + onboarding (trang trí → alt="")
  assert.match(html, /<link rel="icon"[^>]*href="\/assets\/splash-illustration\.webp"/);
  assert.match(html, /class="onboard-splash"[^>]*src="\/assets\/splash-illustration\.webp"/);
  // avatar mặc định trong topbar
  assert.match(html, /src="\/assets\/default-learner-avatar\.webp"/);
  // empty-state-today: có alt mô tả + hidden mặc định
  assert.match(html, /id="todayEmpty"[^>]*hidden/);
  assert.match(html, /src="\/assets\/empty-state-today\.webp"[^>]*alt="Chim cánh cụt/);
  // error-retry: role=alert + hidden + nút thử lại
  assert.match(html, /id="globalError"[^>]*role="alert"[^>]*hidden/);
  assert.match(html, /src="\/assets\/error-retry\.webp"/);
  assert.match(html, /id="globalErrorRetry"[^>]*>Thử lại</);
  // offline-audio: alt mô tả + nút đóng
  assert.match(html, /id="audioOffline"[^>]*hidden/);
  assert.match(html, /src="\/assets\/offline-audio\.webp"[^>]*alt="Bạn học viên/);
  assert.match(html, /id="audioOfflineDismiss"/);
});

test('lv-shell: stage theming, empty state toggle, bắt lỗi audio — không đụng hợp đồng DOM cũ', () => {
  assert.match(shell, /document\.body\.dataset\.stage = age/);
  assert.match(shell, /\['preschool', 'child', 'teen', 'young-adult'\]\.includes/);
  assert.match(shell, /box\.hidden = hasGoals/);
  // KHÔNG monkey-patch Audio.play — app.js đã có fallback audio riêng (lv-shell chỉ cung cấp showAudioOffline)
  assert.match(shell, /function showAudioOffline/);
  assert.match(shell, /lv-last-sync/);
  // LVApi client đủ endpoint sync
  assert.match(api, /\/api\/auth\/register/);
  assert.match(api, /\/api\/auth\/login/);
  assert.match(api, /\/api\/auth\/logout/);
  assert.match(api, /\/api\/auth\/me/);
  assert.match(api, /\/api\/sync\/push/);
  assert.match(api, /\/api\/sync\/pull/);
  assert.match(api, /\/api\/sync\/import-local/);
});

test('script nạp đúng thứ tự: content-core → app → srs → writing → pron → toeic-core → learning → lv-api → lv-shell → toeic', () => {
  const order = [...html.matchAll(/<script src="([a-z-]+\.c?js)"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(order, ['content-core.cjs', 'app.js', 'srs-core.cjs', 'writing-core.cjs', 'pron-core.cjs', 'toeic-core.cjs', 'learning.js', 'lv-api.js', 'lv-shell.js', 'toeic.js']);
});

test('design tokens v2: scale spacing/shadow, 4 stage accent, dark mode block', () => {
  assert.match(cssText, /--space-3xl: 64px/);
  assert.match(cssText, /--shadow-xl:/);
  assert.match(cssText, /body\[data-stage="preschool"\][^}]*#D97706/);
  assert.match(cssText, /body\[data-stage="child"\][^}]*#0284C7/);
  assert.match(cssText, /body\[data-stage="teen"\][^}]*#7C3AED/);
  assert.match(cssText, /body\[data-stage="young-adult"\][^}]*#0F766E/);
  assert.match(cssText, /\[data-theme="dark"\]/);
  assert.match(cssText, /\.empty-state \{/);
  assert.match(cssText, /\.error-state \{/);
  assert.match(cssText, /\.offline-state \{/);
  assert.match(cssText, /\.account-status\[data-state="ok"\]/);
});
