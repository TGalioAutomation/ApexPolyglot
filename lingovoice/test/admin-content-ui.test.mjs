// Test UI tĩnh Content Studio (roadmap #2): markup, wiring, guardrails, design tokens, docs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, js, server, apiSpec, uiDesign] = await Promise.all([
  readFile(new URL('../public/admin/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/admin/admin.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/admin/admin.js', import.meta.url), 'utf8'),
  readFile(new URL('../server.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../docs/api-spec.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/ui-design.md', import.meta.url), 'utf8')
]);

test('Content Studio có đủ markup: tablist 3 loại, filter, bảng, modal soạn, nút hành động', () => {
  for (const id of ['contentTitle', 'contentCount', 'contentLang', 'contentStatus', 'contentRows', 'addContent', 'aiDraftContent', 'runContentSeed', 'contentModal', 'contentModalTitle', 'cfSave', 'cfCancel', 'cfAiFill', 'cfError']) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.match(html, /role="tablist"/);
  assert.match(html, /data-type="readings"/);
  assert.match(html, /data-type="roleplay"/);
  assert.match(html, /data-type="lessons"/);
  assert.match(html, /role="alert"/); // cfError
  assert.match(html, /<dialog[^>]*id="contentModal"/);
});

test('admin.js wiring: loadContent theo tab, CRUD đủ method, escapeHtml, xác nhận xóa', () => {
  assert.match(js, /\/api\/admin\/content\/\$\{CMS\.type\}/);
  assert.match(js, /method: CMS\.editing \? 'PUT' : 'POST'/);
  assert.match(js, /method: 'DELETE'/);
  assert.match(js, /\/ai-draft`, \{ method: 'POST'/);
  assert.match(js, /\/review`, \{ method: 'POST', body: JSON\.stringify\(\{ reviewed/);
  assert.match(js, /confirm\(/); // xóa phải xác nhận
  assert.match(js, /escapeHtml\(item\.topic \|\| item\.title \|\| item\.id\)/);
  assert.match(js, /aria-selected/);
  assert.match(js, /showModal\(\)/);
  assert.match(js, /content-seed/);
  assert.match(js, /setAttribute\('aria-busy', 'true'\)/); // AI draft chờ có feedback
  assert.match(js, /loadContent\(\);\s*$/m);
});

test('CSS: chip trạng thái 2 màu, dialog backdrop, tab ≥44px, responsive + reduced-motion giữ nguyên', () => {
  assert.match(css, /\.content-chip\.draft/);
  assert.match(css, /\.content-chip\.reviewed/);
  assert.match(css, /\.content-modal::backdrop/);
  assert.match(css, /\.cms-tab \{ min-height: 44px/);
  assert.match(css, /\.button\.danger/);
  assert.match(css, /\.cms-toolbar \{ align-items: stretch; flex-direction: column;/); // mobile
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('server: route CMS wired đúng — TYPE_INVALID, review endpoint, job content-seed', () => {
  assert.match(server, /pathname === '\/api\/admin\/content' \|\| pathname\.startsWith\('\/api\/admin\/content\/'\)/);
  assert.match(server, /'TYPE_INVALID'/);
  assert.match(server, /segs\[2\] === 'review'/);
  assert.match(server, /\/api\/admin\/jobs\/content-seed/);
  assert.match(server, /admin\.aiDraft/);
});

test('docs: api-spec §5b + ui-design Content Studio được ghi', () => {
  assert.match(apiSpec, /### 5b\. CMS nội dung học \(roadmap #2\)/);
  assert.match(apiSpec, /\/api\/admin\/content\/:type\/ai-draft/);
  assert.match(uiDesign, /Admin CMS — Content Studio/);
});
