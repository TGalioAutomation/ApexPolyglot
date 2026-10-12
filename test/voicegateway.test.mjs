import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping voice gateway tests');
  process.exit(0);
}

const port = 6100 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', OPENVOX_API: 'http://127.0.0.1:1/v1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let base;
try {
  await once(child.stdout, 'data');
  base = `http://127.0.0.1:${port}`;
  const email = `wss-${Date.now()}@example.com`;
  const register = await fetch(`${base}/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'a-strong-password-123', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', acceptedTermsVersion: '1.0' }) });
  const cookie = register.headers.get('set-cookie').split(';')[0];

  // unauthorized connection is rejected
  const anonWs = new WebSocket(`ws://127.0.0.1:${port}/v1/voice`);
  const anonClose = await new Promise((resolve) => { anonWs.on('close', (code) => resolve(code)); });
  assert.equal(anonClose, 1008);

  // authenticated connection receives session.ready
  const ws = new WebSocket(`ws://127.0.0.1:${port}/v1/voice`, { headers: { cookie } });
  const frames = [];
  ws.on('message', (data) => frames.push(JSON.parse(data.toString())));
  await once(ws, 'open');

  // drive the conversation
  await new Promise((resolve) => setTimeout(resolve, 300));
  ws.send(JSON.stringify({ type: 'audio.start.v1', turnId: 't1' }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  ws.send(JSON.stringify({ type: 'audio.chunk.v1', sequence: 1, timestamp: new Date().toISOString() }));
  ws.send(JSON.stringify({ type: 'audio.chunk.v1', sequence: 2, timestamp: new Date().toISOString() }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  ws.send(JSON.stringify({ type: 'audio.end.v1' }));

  await new Promise((resolve) => setTimeout(resolve, 300));
  const types = frames.map((f) => f.type);
  assert.ok(types.includes('session.ready.v1'));
  assert.ok(types.includes('transcript.partial.v1'));
  assert.ok(types.includes('transcript.final.v1'));
  assert.ok(types.includes('turn.completed.v1'));
  assert.equal(frames[0].type, 'session.ready.v1');

  // barge-in
  frames.length = 0;
  ws.send(JSON.stringify({ type: 'playback.cancel.v1' }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(frames[0].type, 'flow.pause.v1');

  // unsupported frame type yields error.v1
  frames.length = 0;
  ws.send(JSON.stringify({ type: 'bogus.v1' }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(frames[0].type, 'error.v1');

  ws.close();
  console.log('voice gateway (WSS) tests passed');
} finally {
  child.kill('SIGTERM');
}
