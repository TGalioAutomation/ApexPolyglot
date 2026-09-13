// Test API đọc nội dung /api/content/* (roadmap #2):
// - Luôn chạy: DB tắt -> 503 DB_UNAVAILABLE; lang sai -> 400; loại sai -> 404.
// - Có TEST_DATABASE_URL: seed thật -> trả đúng shape mirror literal, draft không lọt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const PORT_DEAD_DB = 4191;
const PORT_LIVE_DB = 4192;

function startApp(port, envOverrides = {}) {
  const env = {
    ...process.env,
    PORT: String(port),
    HOST: '127.0.0.1',
    APP_ACCESS_PASSWORD: '',
    ADMIN_ACCESS_PASSWORD: '',
    DEEPSEEK_API_KEY: '', GEMINI_API_KEY: '', OPENAI_API_KEY: '',
    LV_AUDIO_CACHE_DIR: join(ROOT, 'test', '.cache-content-api'),
    ...envOverrides
  };
  const child = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env, stdio: 'ignore' });
  return new Promise((resolve) => {
    const wait = () => fetch(`http://127.0.0.1:${port}/healthz`).then(() => resolve(child)).catch(() => setTimeout(wait, 150));
    wait();
  });
}

let deadDb;
let liveDb = null;
const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

test.before(async () => {
  deadDb = await startApp(PORT_DEAD_DB, { DATABASE_URL: 'postgres://nobody:x@127.0.0.1:9/none' });
  if (hasTestDb) {
    const { runMigrations } = await import('../db/migrate.mjs');
    const { Store } = await import('../db/store.mjs');
    const { seedContent } = await import('../scripts/seed-content.mjs');
    const pg = (await import('pg')).default;
    await runMigrations(process.env.TEST_DATABASE_URL);
    const store = new Store(new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL }));
    await seedContent(store, { logger: { log() {} } });
    await store.upsertContent('readings', {
      id: 'r-test-draft-hidden', lang: 'en', status: 'draft',
      title: 'Bản nháp không hiện', level: 1, paragraphs: ['X'], questions: []
    });
    await store.pool.end();
    liveDb = await startApp(PORT_LIVE_DB, { DATABASE_URL: process.env.TEST_DATABASE_URL });
  }
});
test.after(async () => {
  deadDb?.kill();
  liveDb?.kill();
  if (hasTestDb) {
    const { Store } = await import('../db/store.mjs');
    const pg = (await import('pg')).default;
    const store = new Store(new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL }));
    await store.deleteContent('readings', 'r-test-draft-hidden').catch(() => {});
    await store.pool.end();
  }
});

test('DB tắt: /api/content/* trả 503 DB_UNAVAILABLE cho frontend fallback literal', async () => {
  for (const kind of ['lessons', 'readings', 'roleplay']) {
    const r = await fetch(`http://127.0.0.1:${PORT_DEAD_DB}/api/content/${kind}?lang=en`);
    assert.equal(r.status, 503, kind);
    assert.equal((await r.json()).code, 'DB_UNAVAILABLE');
  }
});

test('validate đầu vào: lang sai 400, loại lạ 404', async () => {
  assert.equal((await fetch(`http://127.0.0.1:${PORT_DEAD_DB}/api/content/lessons?lang=fr`)).status, 400);
  assert.equal((await fetch(`http://127.0.0.1:${PORT_DEAD_DB}/api/content/lessons`)).status, 400);
  assert.equal((await fetch(`http://127.0.0.1:${PORT_DEAD_DB}/api/content/nonsense?lang=en`)).status, 404);
});

test('DB sống: trả shape mirror literal, chỉ nội dung reviewed', async (t) => {
  if (!hasTestDb) return t.skip('Thiếu TEST_DATABASE_URL — bỏ qua phần DB sống');

  const lessons = await (await fetch(`http://127.0.0.1:${PORT_LIVE_DB}/api/content/lessons?lang=en`)).json();
  assert.ok(lessons.lessons.some((topic) => topic.topic === 'Chào hỏi' && topic.sentences.some((s) => s.id === 'en-greet-1')));

  const readings = await (await fetch(`http://127.0.0.1:${PORT_LIVE_DB}/api/content/readings?lang=en`)).json();
  const level1 = readings.levels['1'];
  assert.ok(level1.length >= 2);
  const first = level1[0];
  assert.ok(first.title && first.paragraphs.length >= 1 && Array.isArray(first.questions));

  const roleplay = await (await fetch(`http://127.0.0.1:${PORT_LIVE_DB}/api/content/roleplay?lang=en`)).json();
  assert.ok(roleplay.scenarios.some((s) => s.id === 'restaurant' && s.title && s.vi));

  // draft không lọt API đọc
  const allTexts = JSON.stringify(readings);
  assert.doesNotMatch(allTexts, /Bản nháp không hiện/);
});

test('frontend wired: content-core nạp trước app.js, app fetch cả 2 ngôn ngữ, learning có hook', async () => {
  const html = await readFile(join(ROOT, 'public', 'index.html'), 'utf8');
  const app = await readFile(join(ROOT, 'public', 'app.js'), 'utf8');
  const learning = await readFile(join(ROOT, 'public', 'learning.js'), 'utf8');
  const core = await readFile(join(ROOT, 'public', 'content-core.cjs'), 'utf8');

  const coreIdx = html.indexOf('content-core.cjs');
  const appIdx = html.indexOf('app.js"');
  assert.ok(coreIdx > -1 && appIdx > coreIdx, 'content-core.cjs phải nạp trước app.js');
  assert.match(app, /loadRemoteContent\s*\(\)/);
  assert.match(app, /\/api\/content\/lessons\?lang=\$\{lang\}/);
  assert.match(app, /window\.LV\.onContent/);
  assert.match(learning, /window\.LV\.onContent = \{/);
  assert.match(learning, /applyReadings\(READING_TEXTS/);
  assert.match(learning, /applyRoleplay\(ROLEPLAY_SCENARIOS/);
  assert.match(core, /CONTENT_TIMEOUT_MS: 2500/);
});
