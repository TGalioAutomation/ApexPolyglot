// LingoVoice integration tests — chạy bằng mock OpenVox + mock DeepSeek (không cần dịch vụ thật)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------- Mock OpenVox ----------
let openvoxSpeechCalls = 0;
let lastTeacherSystem = '';
const openvox = createServer((req, res) => {
  const url = req.url.split('?')[0];
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const models = { data: [{ id: 'kokoro', display_name: 'Kokoro', supports_streaming: true, voice_count: 54 }] };
  const langs = { data: [{ id: 'en', name: 'English' }, { id: 'zh', name: 'Chinese' }] };
  if (url === '/models') return send(200, models);
  if (/^\/models\/[^/]+\/load$/.test(url)) return send(200, { status: 'ready' });
  if (/^\/models\/[^/]+\/languages$/.test(url)) return send(200, langs);
  if (/^\/models\/[^/]+\/voices/.test(url)) {
    const lang = new URL(req.url, 'http://x').searchParams.get('language');
    const voices = { data: lang === 'zh' ? [{ id: 'zf_xiaoxiao' }] : [{ id: 'af_bella' }, { id: 'af_heather' }] };
    return send(200, voices);
  }
  if (url === '/audio/speech') {
    openvoxSpeechCalls += 1;
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0,0,0,0]), Buffer.from('WAVEfmt '),
      Buffer.from([16,0,0,0,1,0,1,0,0x80,0x3e,0,0,0,0,0x7d,0,2,0,16,0]), Buffer.from('data'), Buffer.from([0,0,0,0])]);
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let payload = {};
      try { payload = JSON.parse(body || '{}'); } catch {}
      if (payload.stream) {
        // Streaming SSE: 2 chunk audio (WAV base64) + hoàn tất
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
        res.write('event: response.created\ndata: {"id":"1"}\n\n');
        res.write(`event: audio.chunk\ndata: {"index":0,"sample_rate":44100,"audio":"${wav.toString('base64')}"}\n\n`);
        res.write(`event: audio.chunk\ndata: {"index":1,"sample_rate":44100,"audio":"${wav.toString('base64')}"}\n\n`);
        res.write('event: response.completed\ndata: {"id":"1"}\n\n');
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'audio/wav' });
        res.end(wav);
      }
    });
    return;
  }
  send(404, { error: 'not found' });
});

// ---------- Mock DeepSeek ----------
const deepseek = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const payload = JSON.parse(body || '{}');
    const sys = (payload.messages || []).find((m) => m.role === 'system')?.content || '';
    lastTeacherSystem = sys;
    const user = (payload.messages || []).find((m) => m.role === 'user')?.content || '';
    let content;
    if (sys.includes('thẻ từ vựng')) {
      const user = (payload.messages || []).find((m) => m.role === 'user')?.content || '';
      if (user.includes('tiếng Trung giản thể')) {
        // nhánh ZH: có note + pinyin
        content = JSON.stringify({ meaning: 'kiên trì', example: '我每天坚持学习中文。', pinyin: 'Wǒ měitiān jiānchí xuéxí Zhōngwén.', translation: 'Tôi kiên trì học tiếng Trung mỗi ngày.', note: 'Measure word: 坚持 + động từ.', topic: 'học tập', freq: 1 });
      } else {
        content = JSON.stringify({ meaning: 'lịch trình', example: 'I have a busy schedule today.', translation: 'Hôm nay tôi có lịch trình bận rộn.', topic: 'công việc', pos: 'noun', ipa: '/ˈʃed.juːl/', collocations: ['a busy schedule', 'on schedule'], freq: 1, workplace: true });
      }
    } else if (sys.includes('chấm bài viết')) {
      content = JSON.stringify({ praise: 'Bạn viết rõ ý.', fix: 'Thiếu thì quá khứ cho động từ go.', corrected: 'Yesterday I went to work.', why: 'Sự việc đã xảy ra nên dùng quá khứ đơn.', retry: 'Viết lại đoạn văn.' });
    } else if (sys.includes('đóng vai')) {
      content = JSON.stringify({ reply: 'Good evening! How can I help you?', hint: 'Hãy chào khách và hỏi họ cần gì.' });
    } else if (sys.includes('chấm một cuộc hội thoại')) {
      content = JSON.stringify({ praise: 'Bạn nói rõ ràng và lịch sự.', topFix: 'Thiếu từ xin phép khi chưa hiểu.', corrected: 'Could you repeat that, please?', next: 'Luyện cách hỏi lại lịch sự.' });
    } else {
      content = 'Cô sẽ giúp bạn. Nghe lại nhé: 【Good morning! How are you today?】';
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content } }], model: payload.model, _user: user.slice(0, 60) }));
  });
});

function listen(server) {
  return new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
}
function startApp({ port, ai, envOverrides = {} }) {
  const env = {
    ...process.env,
    PORT: String(port),
    OPENVOX_API: `http://127.0.0.1:${openvoxPort}`,
    PREGEN_DISABLED: '1', // không pregen trong test (tránh gọi mock loạt)
    ...envOverrides
  };
  if (ai) {
    env.DEEPSEEK_API_KEY = 'test';
    env.DEEPSEEK_API_BASE = `http://127.0.0.1:${deepseekPort}`;
    env.DEEPSEEK_MODEL = 'test-model';
    env.AI_PROVIDER = 'deepseek';
  } else {
    // Ép rõ là "không có AI" kể cả khi .env có key thật (đảm bảo isolation test)
    env.DEEPSEEK_API_KEY = '';
    env.GEMINI_API_KEY = '';
    env.OPENAI_API_KEY = '';
  }
  const child = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env, stdio: 'ignore' });
  return new Promise((resolve) => {
    const wait = () => fetch(`http://127.0.0.1:${port}/healthz`).then(() => resolve(child)).catch(() => setTimeout(wait, 150));
    wait();
  });
}

let openvoxPort, deepseekPort, app1, app2, app3, app4, port1 = 4181, port2 = 4182, port3 = 4183, port4 = 4184;

test.before(async () => {
  openvoxPort = await listen(openvox);
  deepseekPort = await listen(deepseek);
  app1 = await startApp({ port: port1, ai: true });
  app2 = await startApp({ port: port2, ai: false });
  app3 = await startApp({
    port: port3,
    ai: false,
    envOverrides: { APP_ACCESS_USER: 'learner', APP_ACCESS_PASSWORD: 'test-pass', MAX_BODY_BYTES: '128' }
  });
  app4 = await startApp({
    port: port4,
    ai: false,
    envOverrides: { ADMIN_ACCESS_USER: 'operator', ADMIN_ACCESS_PASSWORD: 'admin-test-pass' }
  });
});
test.after(() => { app1?.kill(); app2?.kill(); app3?.kill(); app4?.kill(); openvox.close(); deepseek.close(); });

test('healthz trả 200', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/healthz`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
});

test('phục vụ index.html', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
  assert.match(await r.text(), /LingoVoice/);
});

test('bản public bảo vệ giao diện và API bằng Basic Auth nhưng vẫn mở healthcheck', async () => {
  const health = await fetch(`http://127.0.0.1:${port3}/healthz`);
  assert.equal(health.status, 200);

  const denied = await fetch(`http://127.0.0.1:${port3}/`);
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('www-authenticate'), /Basic/);

  const auth = Buffer.from('learner:test-pass').toString('base64');
  const allowed = await fetch(`http://127.0.0.1:${port3}/`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('x-frame-options'), 'DENY');
});

test('server từ chối request body vượt giới hạn cấu hình', async () => {
  const auth = Buffer.from('learner:test-pass').toString('base64');
  const r = await fetch(`http://127.0.0.1:${port3}/api/placement/start`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en', padding: 'x'.repeat(256) })
  });
  assert.equal(r.status, 413);
});

test('admin có credential riêng và phục vụ dashboard', async () => {
  const denied = await fetch(`http://127.0.0.1:${port4}/admin`);
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('www-authenticate'), /LingoVoice Admin/);
  const auth = Buffer.from('operator:admin-test-pass').toString('base64');
  const allowed = await fetch(`http://127.0.0.1:${port4}/admin`, { headers: { Authorization: `Basic ${auth}` } });
  assert.equal(allowed.status, 200);
  assert.match(await allowed.text(), /LingoVoice Admin/);
});

test('admin overview chỉ trả trạng thái vận hành, không lộ secret', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/admin/overview`);
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.deliveryMode, 'prepared-only');
  assert.ok(data.catalog.audioTargets > 0);
  assert.equal(data.data.reports.length, 2);
  assert.ok(!JSON.stringify(data).includes('DEEPSEEK_API_KEY'));
});

test('voice status có OpenVox', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/voice/status`);
  const d = await r.json();
  assert.equal(d.available, true);
  // mock OpenVox chỉ có kokoro nên cả en và zh đều fallback về kokoro
  assert.equal(d.activeModel.en, 'kokoro');
  assert.equal(d.activeModel.zh, 'kokoro');
  assert.deepEqual(d.defaultVoices, { en: 'af_bella', zh: 'zf_xiaoxiao' });
});

test('voice options trả danh sách giọng theo từng ngôn ngữ', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/voice/options`);
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.deepEqual(d.languages.en.voices, ['af_bella', 'af_heather']);
  assert.deepEqual(d.languages.zh.voices, ['zf_xiaoxiao']);
  assert.equal(d.languages.en.defaultVoice, 'af_bella');
});

test('live synthesis bị khóa khỏi public app khi đã cấu hình admin credential', async () => {
  const denied = await fetch(`http://127.0.0.1:${port4}/api/voice/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `locked-${Date.now()}`, language: 'en' })
  });
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('www-authenticate'), /LingoVoice Admin/);

  const auth = Buffer.from('operator:admin-test-pass').toString('base64');
  const allowed = await fetch(`http://127.0.0.1:${port4}/api/voice/speak`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `allowed-${Date.now()}`, language: 'en' })
  });
  assert.equal(allowed.status, 200);
  assert.match(allowed.headers.get('content-type'), /audio\/wav/);
});

test('voice speak trả WAV', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/voice/speak`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `speak-${Date.now()}`, language: 'en' })
  });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /audio\/wav/);
  assert.equal(r.headers.get('x-voice-name'), 'af_bella');
  const buf = Buffer.from(await r.arrayBuffer());
  assert.equal(buf.slice(0, 4).toString(), 'RIFF');
});

test('voice speak dùng đúng custom voice được chọn', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/voice/speak`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `custom-voice-${Date.now()}`, language: 'en', voice: 'af_heather', speed: 1.05 })
  });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-voice-name'), 'af_heather');
});

test('voice speak từ chối ngôn ngữ lạ (400)', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/voice/speak`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'hi', language: 'xx' })
  });
  assert.equal(r.status, 400);
});

test('voice speak cache: lần 2 không gọi OpenVox (cache hit)', async () => {
  const unique = `cache-test-${Date.now()}-sentence`;
  const before = openvoxSpeechCalls;
  const r1 = await fetch(`http://127.0.0.1:${port1}/api/voice/speak`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(r1.headers.get('x-audio-cache'), 'miss');
  const after1 = openvoxSpeechCalls;
  assert.equal(after1 - before, 1, 'lần đầu phải gọi OpenVox 1 lần');

  const r2 = await fetch(`http://127.0.0.1:${port1}/api/voice/speak`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(r2.headers.get('x-audio-cache'), 'hit');
  assert.equal(openvoxSpeechCalls, after1, 'lần 2 phải lấy từ cache, không gọi OpenVox');
  const b1 = Buffer.from(await r1.arrayBuffer());
  const b2 = Buffer.from(await r2.arrayBuffer());
  assert.equal(b1.length, b2.length, 'audio cache trùng nội dung lần 1');
});

test('prepared-only không sinh audio khi thiếu và phục vụ file sau khi admin pipeline đã tạo', async () => {
  const unique = `prepared-only-${Date.now()}`;
  const before = openvoxSpeechCalls;
  const missing = await fetch(`http://127.0.0.1:${port1}/api/voice/prepared`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, 'AUDIO_NOT_PREPARED');
  assert.equal(openvoxSpeechCalls, before, 'prepared-only không được gọi OpenVox khi thiếu');

  const generated = await fetch(`http://127.0.0.1:${port1}/api/voice/speak`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(generated.status, 200);
  await generated.arrayBuffer();
  const afterGenerate = openvoxSpeechCalls;

  const prepared = await fetch(`http://127.0.0.1:${port1}/api/voice/prepared`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(prepared.status, 200);
  assert.equal(prepared.headers.get('x-audio-cache'), 'prepared');
  assert.equal(openvoxSpeechCalls, afterGenerate, 'phục vụ prepared file không gọi OpenVox');
});

test('pregen có thể backfill manifest từ WAV mặc định mà không cần gọi OpenVox lại', async () => {
  const unique = `offline-backfill-${Date.now()}`;
  const generated = await fetch(`http://127.0.0.1:${port1}/api/voice/speak`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(generated.status, 200);
  await generated.arrayBuffer();
  const before = openvoxSpeechCalls;
  const prepared = await fetch(`http://127.0.0.1:${port1}/api/voice/prepared`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(prepared.status, 200);
  assert.equal(openvoxSpeechCalls, before);
});

test('voice speak stream: proxy SSE, forward chunks, lưu cache sau', async () => {
  const unique = `stream-${Date.now()}-sentence`;
  const before = openvoxSpeechCalls;
  const r = await fetch(`http://127.0.0.1:${port1}/api/voice/speak/stream`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /audio\/wav/);
  // lần đầu (unique) -> miss, stream từ OpenVox
  assert.equal(r.headers.get('x-audio-cache'), 'miss');
  assert.equal(r.headers.get('x-stream'), 'openvox');
  const buf = Buffer.from(await r.arrayBuffer());
  assert.ok(buf.length >= 44, 'có dữ liệu audio forward');
  assert.equal(openvoxSpeechCalls - before, 1, 'đã gọi OpenVox 1 lần');

  // lần 2 cùng text -> cache hit (đã lưu khi stream xong)
  const r2 = await fetch(`http://127.0.0.1:${port1}/api/voice/speak/stream`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: unique, language: 'en' })
  });
  assert.equal(r2.headers.get('x-audio-cache'), 'hit');
  assert.equal(openvoxSpeechCalls - before, 1, 'lần 2 không gọi OpenVox nữa');
});

test('teacher status nhận DeepSeek khi có key', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/teacher/status`);
  const d = await r.json();
  assert.equal(d.configured, true);
  assert.equal(d.active, 'deepseek');
});

test('teacher chat gọi LLM và trả reply + ngữ cảnh', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/teacher/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Câu này nghĩa gì?', language: 'en', context: { screen: 'lessons', topic: 'Chào hỏi', sentence: 'Good morning!' } })
  });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.provider, 'deepseek');
  assert.match(d.reply, /【Good morning!/);
  assert.equal(d.language, 'en');
});

test('teacher chat áp dụng và chuẩn hóa tính cách tùy chỉnh', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/teacher/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Sửa câu này giúp tôi', language: 'en',
      assistantProfile: { personality: 'strict', voices: { en: '../../bad', zh: 'zf_xiaoxiao' }, speed: 9 }
    })
  });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.assistantProfile.personality, 'strict');
  assert.equal(d.assistantProfile.voices.en, null);
  assert.equal(d.assistantProfile.voices.zh, 'zf_xiaoxiao');
  assert.equal(d.assistantProfile.speed, 1.15);
  assert.match(lastTeacherSystem, /Kỷ luật:/);
});

test('teacher chat trả 503 NO_AI khi chưa có key', async () => {
  const r = await fetch(`http://127.0.0.1:${port2}/api/teacher/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'xin chào', language: 'en' })
  });
  assert.equal(r.status, 503);
  const d = await r.json();
  assert.equal(d.code, 'NO_AI');
});

test('teacher chat nhận history (giữ mạch hội thoại)', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/teacher/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hôm nay tôi học gì?', language: 'en', history: [{ role: 'user', text: 'Xin chào' }, { role: 'teacher', text: 'Chào bạn!' }], context: { screen: 'speaking', topic: 'Trò chuyện' } })
  });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.ok(d.reply);
});

test('teacher chat thiếu message -> 400', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/teacher/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en' })
  });
  assert.equal(r.status, 400);
});

// ---------- P4 placement (deterministic, không cần LLM) ----------
test('placement start trả câu hỏi không có answer key', async () => {
  const r = await fetch(`http://127.0.0.1:${port2}/api/placement/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en' })
  });
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.ok(d.questions.length >= 4);
  assert.ok(!JSON.stringify(d).includes('"answer"'));
});

test('placement submit chấm deterministic', async () => {
  const r = await fetch(`http://127.0.0.1:${port2}/api/placement/submit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en', answers: [
      { id: 'en-p1', answer: 0 }, { id: 'en-p2', answer: 0 }, { id: 'en-p3', answer: 1 }, { id: 'en-p4', answer: 1 },
      { id: 'en-p5', answer: 'I am a student and I learn English every day.' },
      { id: 'en-p6', answer: 'Could you repeat that please? I understand slowly.' }
    ] })
  });
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.ok(d.level >= 1 && d.level <= 7);
  assert.ok(typeof d.overall === 'number');
  assert.ok(['listening', 'reading', 'speaking'].includes(d.weakest));
});

// ---------- P0 vocab card (LLM mock) ----------
test('vocab card tạo thẻ từ qua LLM (EN đầy đủ trường)', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/vocab/card`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term: 'schedule', language: 'en' })
  });
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.equal(d.term, 'schedule');
  assert.ok(d.meaning && d.example && d.translation);
  assert.ok(d.pos && d.ipa, 'có từ loại + IPA');
  assert.ok(Array.isArray(d.collocations) && d.collocations.length === 2, 'có 2 collocations');
  assert.ok(Number.isInteger(d.freq) && d.freq >= 1 && d.freq <= 5, 'có freq 1-5');
  assert.equal(typeof d.workplace, 'boolean', 'có workplace');
});

test('vocab card tạo thẻ từ qua LLM (ZH có pinyin + note)', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/vocab/card`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term: '坚持', language: 'zh' })
  });
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.ok(d.pinyin && d.note, 'có pinyin + note');
  assert.ok(Number.isInteger(d.freq) && d.freq >= 1 && d.freq <= 5, 'có freq');
  assert.ok(d.meaning && d.example && d.translation);
});

// ---------- P1 writing feedback (LLM mock) ----------
test('writing feedback trả cấu trúc chấm bài', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/writing/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Yesterday I go to work.', prompt: 'Write about your day.', language: 'en' })
  });
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.ok(d.praise && d.fix && d.corrected && d.why && d.retry);
});

// ---------- P2 roleplay turn (LLM mock) ----------
test('roleplay turn mở đầu hội thoại', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/roleplay/turn`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: { title: 'At the restaurant' }, language: 'en', level: 3, history: [] })
  });
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.ok(d.reply && d.hint);
});

test('roleplay turn lỗi khi thiếu scenario -> 400', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/roleplay/turn`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en' })
  });
  assert.equal(r.status, 400);
});

test('roleplay feedback trả nhận xét cuộc gọi (praise/topFix/next)', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/roleplay/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario: { title: 'At the restaurant' }, language: 'en',
      history: [{ role: 'teacher', text: 'Good evening! How can I help you?' }, { role: 'user', text: 'Hello, I want a table for two please.' }]
    })
  });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.ok(d.praise && d.topFix && d.next);
  assert.ok(typeof d.corrected === 'string');
});

test('data route phục vụ vocab JSON đã chuẩn bị', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/data/vocab-en.json`);
  // 200 nếu đã có data/vocab-en.json, 404 nếu chưa — không được lỗi khác
  assert.ok(r.status === 200 || r.status === 404, 'status ' + r.status);
  if (r.status === 200) {
    const d = await r.json();
    assert.ok(Array.isArray(d.items));
    assert.ok(d.items.length >= 0);
  }
});

// ---------- Trí nhớ dài hạn (memory) ----------
const LID = `test-${Date.now()}`;

test('memory GET trả bộ nhớ mặc định cho learner', async () => {
  const r = await fetch(`http://127.0.0.1:${port2}/api/memory?learner=${LID}`);
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.learnerId, LID);
  assert.ok(d.profile);
  assert.equal(d.placement.en, null);
});

test('memory POST lưu placement/progress/day rồi GET đọc lại (persist)', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/memory`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId: LID, patch: {
      placement: { en: { level: 3, overall: 48, weakest: 'speaking', skills: { speaking: 40, reading: 55, listening: 50 } } },
      progress: { en: { learned: 12, due: 3, mistakes: 2 } },
      day: 5
    } })
  });
  assert.equal(r.status, 200);
  const g = await fetch(`http://127.0.0.1:${port1}/api/memory?learner=${LID}`);
  const d = await g.json();
  assert.equal(d.placement.en.level, 3);
  assert.equal(d.placement.en.weakest, 'speaking');
  assert.equal(d.progress.en.learned, 12);
  assert.equal(d.day, 5);
});

test('memory note lưu và đọc lại', async () => {
  const r = await fetch(`http://127.0.0.1:${port1}/api/memory/note`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId: LID, note: 'Học viên muốn tự tin phỏng vấn.' })
  });
  assert.equal(r.status, 200);
  const g = await fetch(`http://127.0.0.1:${port1}/api/memory?learner=${LID}`);
  const d = await g.json();
  assert.ok(d.notes.some((n) => n.text === 'Học viên muốn tự tin phỏng vấn.'));
});
