import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping persistence integration tests');
  process.exit(0);
}

const port = 5400 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `persist-${Date.now()}@example.com`;

  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];

  // profile defaults
  const profile = await (await fetch(`${base}/me/profile`, { headers: { cookie } })).json();
  assert.equal(profile.dailyMinutes, 35);
  const patched = await (await fetch(`${base}/me/profile`, { method: 'PATCH', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ dailyMinutes: 45 }) })).json();
  assert.equal(patched.dailyMinutes, 45);

  // start assessment
  const start = await (await fetch(`${base}/v1/assessment-runs`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', kind: 'placement' }) })).json();
  assert.ok(start.assessmentId);
  assert.equal(start.questions.length, 6);
  assert.equal('answer' in start.questions[0], false);
  const runId = start.assessmentId;

  // save attempts idempotently
  const answers = [
    { id: 'en-meaning-1', answer: 0 },
    { id: 'en-listen-1', answer: 1 },
    { id: 'en-grammar-1', answer: 1 },
    { id: 'en-reading-2', answer: 1 },
    { id: 'en-speak-1', answer: 'I am Minh and my goal is to learn English for work and travel every day' },
    { id: 'en-speak-2', answer: 'I do not understand. Could you please repeat that more slowly so I can understand you?' }
  ];
  for (const [i, a] of answers.entries()) {
    const saved = await fetch(`${base}/v1/assessment-runs/${runId}/attempts`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ clientAttemptId: `c-${i}`, itemId: a.id, response: a.answer }) });
    assert.equal(saved.status, 201);
  }

  // submit
  const result = await (await fetch(`${base}/v1/assessment-runs/${runId}/submit`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ language: 'en', kind: 'placement', goal: 'level 7', answers }) })).json();
  assert.equal(result.overall, 100);
  assert.equal(result.estimatedLevel, 7);
  assert.equal(result.plan.requirements.length, 3);
  assert.equal(result.plan.provider, 'demo');

  // run is now finalized (no longer resumable)
  const resume = await fetch(`${base}/v1/assessment-runs/${runId}`, { headers: { cookie } });
  assert.equal(resume.status, 404);

  console.log('persistence integration tests passed');
} finally {
  child.kill('SIGTERM');
}
