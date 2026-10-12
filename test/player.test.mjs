import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping lesson player tests');
  process.exit(0);
}

const port = 5800 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `player-${Date.now()}@example.com`;
  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];

  // fetch today's plan
  const today = await (await fetch(`${base}/v1/today?language=en&day=1`, { headers: { cookie } })).json();
  assert.equal(today.items.length, 4);
  const firstLesson = today.items[0];

  // fetch a specific lesson
  const lesson = await (await fetch(`${base}/v1/lessons/${firstLesson.type}?language=en&day=1`, { headers: { cookie } })).json();
  assert.equal(lesson.lessonId, firstLesson.lessonId);
  assert.ok(lesson.content.title);
  assert.ok(lesson.content.outcome);

  // start a session
  const started = await (await fetch(`${base}/v1/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ lessonId: firstLesson.lessonId, language: 'en' }) })).json();
  assert.ok(started.sessionId);
  const sessionId = started.sessionId;

  // complete it
  const complete = await (await fetch(`${base}/v1/sessions/${sessionId}/complete`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ meaningfulSeconds: 650 }) })).json();
  assert.equal(complete.completed, true);

  // completing again is a conflict
  const again = await fetch(`${base}/v1/sessions/${sessionId}/complete`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ meaningfulSeconds: 100 }) });
  assert.equal(again.status, 409);

  // weekly report reflects the completed session
  const report = await (await fetch(`${base}/v1/reports/weekly?language=en`, { headers: { cookie } })).json();
  assert.equal(report.sessionsCompleted, 1);
  assert.equal(report.meaningfulMinutes, Math.round(650 / 60));

  // next best action (no mastery yet -> rotates by day)
  const nba = await (await fetch(`${base}/v1/me/next-best?language=en&day=1`, { headers: { cookie } })).json();
  assert.ok(nba.type);
  assert.ok(nba.reason);

  console.log('lesson player & report tests passed');
} finally {
  child.kill('SIGTERM');
}
