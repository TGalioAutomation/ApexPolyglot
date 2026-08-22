import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping evidence integration tests');
  process.exit(0);
}

const port = 5500 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `evidence-${Date.now()}@example.com`;
  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];

  // unauthenticated rejected
  assert.equal((await fetch(`${base}/v1/evidence`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 401);

  // empty mastery initially
  const empty = await (await fetch(`${base}/v1/me/mastery?language=en`, { headers: { cookie } })).json();
  assert.equal(empty.skills.length, 0);

  // append evidence
  const runSuffix = Date.now();
  const ev = await (await fetch(`${base}/v1/evidence`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', skillCode: 'listening', sourceType: 'assessment', sourceId: `evidence-1-${runSuffix}`, measure: 0.8 }) })).json();
  assert.equal(ev.accepted, true);

  const ev2 = await (await fetch(`${base}/v1/evidence`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', skillCode: 'listening', sourceType: 'assessment', sourceId: `evidence-2-${runSuffix}`, measure: 1.0 }) })).json();
  assert.equal(ev2.accepted, true);

  // duplicate source is idempotent (returns 200 accepted:false)
  const dup = await fetch(`${base}/v1/evidence`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', skillCode: 'listening', sourceType: 'assessment', sourceId: `evidence-1-${runSuffix}`, measure: 0.2 }) });
  assert.equal(dup.status, 200);
  assert.equal((await dup.json()).accepted, false);

  // mastery reflects the projection
  const mastery = await (await fetch(`${base}/v1/me/mastery?language=en`, { headers: { cookie } })).json();
  const listening = mastery.skills.find((s) => s.skillCode === 'listening');
  assert.ok(listening);
  assert.equal(listening.recognition, 0.9, 'avg of 0.8 and 1.0');

  // unknown skill rejected
  const bad = await fetch(`${base}/v1/evidence`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', skillCode: 'nonsense', sourceType: 'assessment', sourceId: 'x', measure: 0.5 }) });
  assert.equal(bad.status, 422);

  console.log('evidence ledger & mastery tests passed');
} finally {
  child.kill('SIGTERM');
}
