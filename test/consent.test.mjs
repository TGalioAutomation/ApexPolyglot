import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping consent/observability tests');
  process.exit(0);
}

const port = 5300 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let logs = '';
child.stderr.on('data', (chunk) => { logs += chunk; });
child.stdout.on('data', (chunk) => { logs += chunk; });
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `consent-${Date.now()}@example.com`;

  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];
  const { csrfToken } = (await (await fetch(`${base}/v1/auth/session`, { headers: { cookie } })).json());

  // unauthenticated consent is rejected
  const anon = await fetch(`${base}/v1/consents`);
  assert.equal(anon.status, 401);

  // initial state is empty
  const empty = await (await fetch(`${base}/v1/consents`, { headers: { cookie } })).json();
  assert.equal(empty.consents.length, 0);

  // record a consent
  const granted = await (await fetch(`${base}/v1/consents`, { method: 'POST', headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': csrfToken }, body: JSON.stringify({ type: 'audio_retention', policyVersion: 'policy-2026-01', granted: true }) })).json();
  assert.equal(granted.granted, true);
  assert.equal(granted.type, 'audio_retention');

  // persists
  const after = await (await fetch(`${base}/v1/consents`, { headers: { cookie } })).json();
  assert.equal(after.consents.length, 1);
  assert.equal(after.consents[0].granted, true);

  // invalid type
  const invalid = await fetch(`${base}/v1/consents`, { method: 'POST', headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': csrfToken }, body: JSON.stringify({ type: 'bogus', policyVersion: 'p', granted: true }) });
  assert.equal(invalid.status, 422);

  // observability: /v1/ requests are logged with duration
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.match(logs, /"msg":"request"/);
  assert.match(logs, /"url":"\/v1\/consents"/);

  console.log('consent & observability tests passed');
} finally {
  child.kill('SIGTERM');
}
