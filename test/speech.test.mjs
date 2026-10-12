import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping speech scoring tests');
  process.exit(0);
}

const port = 6000 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `stt-${Date.now()}@example.com`;
  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];

  // need a session to attach the speech attempt
  const lesson = await (await fetch(`${base}/v1/lessons/speaking?language=en&day=1`, { headers: { cookie } })).json();
  assert.ok(lesson.lessonId);
  const started = await (await fetch(`${base}/v1/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ lessonId: lesson.lessonId, language: 'en' }) })).json();
  const sessionId = started.sessionId;

  // transcript-only score is marked preliminary and never claims pronunciation
  const target = 'Small habits become powerful when we repeat them';
  const analysis = await (await fetch(`${base}/v1/speech/score`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ sessionId, transcript: target, targetText: target, language: 'en' }) })).json();
  assert.equal(analysis.status, 'preliminary');
  assert.equal(analysis.asrConfidence, null);
  assert.equal('pronunciationScore' in analysis, false);
  assert.equal('toneScore' in analysis, false);
  assert.ok(analysis.score > 0, 'transcript matching should give a score');
  assert.match(analysis.caveat, /transcript/);

  // Chinese path is marked preliminary too (no tone claim without audio analyzer)
  const zh = await (await fetch(`${base}/v1/speech/score`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ sessionId, transcript: '我明天去图书馆', targetText: '我明天去图书馆', language: 'zh-CN' }) })).json();
  assert.equal(zh.status, 'preliminary');
  assert.equal('toneScore' in zh, false);

  // requires transcript
  const bad = await fetch(`${base}/v1/speech/score`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ sessionId, transcript: '', targetText: target, language: 'en' }) });
  assert.equal(bad.status, 422);

  console.log('speech scoring (TADR-006) tests passed');
} finally {
  child.kill('SIGTERM');
}
