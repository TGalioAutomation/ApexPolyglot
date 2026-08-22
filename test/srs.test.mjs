import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping SRS integration tests');
  process.exit(0);
}

const port = 5600 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `srs-${Date.now()}@example.com`;
  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];

  // add two items
  const item1 = await (await fetch(`${base}/v1/review/items`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', type: 'word', canonicalText: `confidence-${Date.now()}`, context: { meaning: 'tự tin' } }) })).json();
  assert.ok(item1.itemId);
  const item2 = await (await fetch(`${base}/v1/review/items`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', type: 'phrase', canonicalText: `I am confident-${Date.now()}`, context: {} }) })).json();
  assert.ok(item2.itemId);

  // both are due initially
  const due = await (await fetch(`${base}/v1/reviews/due?language=en`, { headers: { cookie } })).json();
  assert.equal(due.items.length, 2);

  // review item1 with a pass (grade 5) -> schedules future due
  const reviewed = await (await fetch(`${base}/v1/reviews/${item1.itemId}?language=en`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ grade: 5 }) })).json();
  assert.ok(reviewed.dueAt, 'passed item should get a future due date');
  assert.equal(reviewed.lastGrade, 5);
  assert.equal(reviewed.revision, 1);

  // item1 no longer due; item2 still due
  const due2 = await (await fetch(`${base}/v1/reviews/due?language=en`, { headers: { cookie } })).json();
  assert.equal(due2.items.length, 1);
  assert.equal(due2.items[0].itemId, item2.itemId);

  // review item2 with a fail (grade 0) -> due immediately (no future date)
  const failed = await (await fetch(`${base}/v1/reviews/${item2.itemId}?language=en`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ grade: 0 }) })).json();
  assert.equal(failed.dueAt, null, 'failed item should be due again now');
  assert.equal(failed.state, 'learning');

  // invalid grade rejected
  const bad = await fetch(`${base}/v1/reviews/${item1.itemId}?language=en`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ grade: 9 }) });
  assert.equal(bad.status, 422);

  console.log('SRS scheduling tests passed');
} finally {
  child.kill('SIGTERM');
}
