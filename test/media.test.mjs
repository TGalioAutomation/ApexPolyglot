import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping media upload tests');
  process.exit(0);
}

const s3Configured = process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY;

const port = 5900 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: {
    ...process.env,
    PORT: String(port),
    DATABASE_URL: dbUrl,
    GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '',
    OPENVOX_API: 'http://127.0.0.1:1/v1',
    ...(s3Configured ? { S3_ENDPOINT: process.env.S3_ENDPOINT, S3_BUCKET: process.env.S3_BUCKET, S3_ACCESS_KEY: process.env.S3_ACCESS_KEY, S3_SECRET_KEY: process.env.S3_SECRET_KEY } : {})
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `media-${Date.now()}@example.com`;
  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];

  if (!s3Configured) {
    // S3 not configured: intent creation returns 503
    const res = await fetch(`${base}/v1/media/upload-intents`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ purpose: 'speech_capture', mimeType: 'audio/webm', bytes: 1024 }) });
    assert.equal(res.status, 503);
  } else {
    const intent = await (await fetch(`${base}/v1/media/upload-intents`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ purpose: 'speech_capture', mimeType: 'audio/webm', bytes: 1024 }) })).json();
    assert.ok(intent.mediaObjectId);
    assert.ok(intent.uploadUrl);
    assert.equal(intent.purpose, 'speech_capture');

    // presigned URL is PUT-able
    const put = await fetch(intent.uploadUrl, { method: 'PUT', headers: { 'content-type': 'audio/webm' }, body: 'fake-audio-bytes' });
    assert.equal(put.status, 200);
  }

  // invalid purpose rejected
  const bad = await fetch(`${base}/v1/media/upload-intents`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ purpose: 'bogus', mimeType: 'audio/webm', bytes: 1024 }) });
  assert.equal(bad.status, 422);

  console.log(s3Configured ? 'media upload tests passed (presigned PUT to S3)' : 'media upload tests passed (S3 not configured, 503 path)');
} finally {
  child.kill('SIGTERM');
}
