import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/index.html', root), 'utf8');
const js = await readFile(new URL('public/app.js', root), 'utf8');
const learningJs = await readFile(new URL('public/learning.js', root), 'utf8');
const css = await readFile(new URL('public/styles.css', root), 'utf8');

test('nút nói của Cô Linh có semantic và trạng thái truy cập được', () => {
  assert.match(html, /id="teacherMic"[^>]+aria-label="Nói với Cô Linh"[^>]+aria-pressed="false"/);
  assert.match(css, /\.teacher-mic\[aria-pressed="true"\]/);
  assert.match(css, /width:\s*48px;\s*height:\s*48px/);
  assert.match(css, /prefers-reduced-motion:[^)]+\)[\s\S]+\.teacher-mic\[aria-pressed="true"\][\s\S]+animation:\s*none/);
});

test('voice chat ưu tiên Android bridge và có browser fallback', () => {
  assert.match(js, /window\.LingoVoiceSpeech\.postMessage/);
  assert.match(js, /window\.SpeechRecognition\s*\|\|\s*window\.webkitSpeechRecognition/);
  assert.match(js, /updateSpeechTranscript\(payload\.transcript, true\)/);
  assert.match(js, /sendTeacherMessage\(transcript\)/);
  assert.match(js, /listenOnceWithNative/);
  assert.match(js, /listenOnceWithBrowser/);
});

test('Cô Linh đọc toàn bộ phản hồi bằng OpenVox và giữ ngôn ngữ từng đoạn', () => {
  assert.match(js, /fetch\(opts\.teacherVoice \? '\/api\/voice\/teacher' : '\/api\/voice\/prepared'/);
  assert.match(js, /playText\(part, 'vi', \{ announceFallback: false, teacherVoice: true \}\)/);
  assert.match(js, /return speakTeacherReply\(reply, lang\)/);
});

test('voice chat công bố lỗi quyền và khôi phục UI', () => {
  assert.match(js, /permission_denied:\s*'Cần quyền micro/);
  assert.match(js, /setCoLinhState\('error', message\)/);
  assert.match(js, /cancelTeacherSpeech\(\)/);
});

test('các luồng luyện nói dùng speech adapter chung cho Android WebView', () => {
  assert.match(js, /listenOnce,/);
  assert.match(learningJs, /async function rpMic\(\)[\s\S]+LV\.listenOnce/);
  assert.match(learningJs, /function vcListen\(\)[\s\S]+LV\.listenOnce/);
  assert.match(learningJs, /async function qaMic\(\)[\s\S]+LV\.listenOnce/);
});
