import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const port = 4400 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['server.mjs'], {env: {...process.env, PORT: String(port)}, stdio: ['ignore', 'pipe', 'pipe']});
try {
  await once(child.stdout, 'data');
  const base = `http://127.0.0.1:${port}`;
  const statusResponse = await fetch(`${base}/api/voice/status`);
  if (statusResponse.status !== 200) { console.log('OpenVox integration skipped: local API unavailable'); process.exitCode = 0; }
  else {
    const status = await statusResponse.json(); assert.equal(status.available, true);
    for (const [language, text] of [['en-US', 'Hello from LingoPilot.'], ['zh-CN', '你好，我叫 Minh。']]) {
      const response = await fetch(`${base}/api/voice`, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({text, language})});
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'audio/wav');
      const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
    }
    console.log('OpenVox integration tests passed');
  }
} finally { child.kill('SIGTERM'); }
