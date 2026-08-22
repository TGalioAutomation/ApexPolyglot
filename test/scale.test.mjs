import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { SLO_TARGETS } from '../dist/operations/slo.js';

// SLO config sanity
assert.ok(SLO_TARGETS.length >= 5);
assert.equal(SLO_TARGETS.find((s) => s.name === 'api_authenticated_availability').target, '99.9%');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping scale/readiness tests');
  process.exit(0);
}

const port = 6300 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;

  // readiness reflects a reachable DB
  const ready = await (await fetch(`${base}/health/ready`)).json();
  assert.equal(ready.database, 'ok');
  assert.equal(ready.ready, true);

  // unauthenticated outbox rejected
  assert.equal((await fetch(`${base}/v1/outbox`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic: 'x' }) })).status, 401);

  // enqueue + publish outbox
  const email = `scale-${Date.now()}@example.com`;
  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  const cookie = register.headers.get('set-cookie').split(';')[0];
  const enqueued = await (await fetch(`${base}/v1/outbox`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ topic: 'learning.session.completed', aggregateId: 'agg-1', payload: { day: 1 } }) })).json();
  assert.ok(enqueued.id);

  // publish requires admin (learner is forbidden)
  const forbidden = await fetch(`${base}/v1/outbox/publish`, { method: 'POST', headers: { cookie } });
  assert.equal(forbidden.status, 403);

  console.log('scale & readiness (SRE) tests passed');
} finally {
  child.kill('SIGTERM');
}
