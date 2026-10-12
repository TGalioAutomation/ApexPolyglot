import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping auth integration tests');
  process.exit(0);
}

const port = 5100 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `auth-${Date.now()}@example.com`;

  const anon = await fetch(`${base}/v1/auth/session`);
  assert.equal(anon.status, 401);
  const anonBody = await anon.json();
  assert.equal(anonBody.authenticated, false);

  const invalidRegister = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'short', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(invalidRegister.status, 422);

  const registerRes = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(registerRes.status, 201);
  const registerBody = await registerRes.json();
  assert.ok(registerBody.userId);
  assert.equal(registerBody.session.authenticated, true);
  assert.ok(registerBody.session.csrfToken);
  const cookie = registerRes.headers.get('set-cookie');
  assert.match(cookie, /__Host-lingopilot_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);

  const duplicate = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'another-strong-password', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(duplicate.status, 409);

  const authed = await fetch(`${base}/v1/auth/session`, { headers: { cookie: cookie.split(';')[0] } });
  assert.equal(authed.status, 200);
  const authedBody = await authed.json();
  assert.equal(authedBody.authenticated, true);
  assert.equal(authedBody.roles.includes('learner'), true);
  const csrfToken = authedBody.csrfToken;
  assert.ok(csrfToken);

  // CSRF enforced: logout without token is forbidden
  const logoutNoCsrf = await fetch(`${base}/v1/auth/session`, { method: 'DELETE', headers: { cookie: cookie.split(';')[0] } });
  assert.equal(logoutNoCsrf.status, 403);
  const stillAuthed = await fetch(`${base}/v1/auth/session`, { headers: { cookie: cookie.split(';')[0] } });
  assert.equal(stillAuthed.status, 200);

  const badLogin = await fetch(`${base}/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'wrong-password-123' }) });
  assert.equal(badLogin.status, 401);

  const loginRes = await fetch(`${base}/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123' }) });
  assert.equal(loginRes.status, 200);
  assert.equal((await loginRes.json()).session.authenticated, true);

  const logout = await fetch(`${base}/v1/auth/session`, { method: 'DELETE', headers: { cookie: cookie.split(';')[0], 'x-csrf-token': csrfToken } });
  assert.equal(logout.status, 204);
  const afterLogout = await fetch(`${base}/v1/auth/session`, { headers: { cookie: cookie.split(';')[0] } });
  assert.equal(afterLogout.status, 401);

  const recovery = await fetch(`${base}/v1/auth/recovery-requests`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
  assert.equal(recovery.status, 202);
  const unknownRecovery = await fetch(`${base}/v1/auth/recovery-requests`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'nobody-' + Date.now() + '@example.com' }) });
  assert.equal(unknownRecovery.status, 202);

  console.log('auth integration tests passed');
} finally {
  child.kill('SIGTERM');
}
