// UI static test — mode "Phát âm" trong tab Speaking (hợp đồng DOM + wiring + style)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/index.html', root), 'utf8');
const learningJs = await readFile(new URL('public/learning.js', root), 'utf8');
const css = await readFile(new URL('public/styles.css', root), 'utf8');
const coreJs = await readFile(new URL('public/pron-core.cjs', root), 'utf8');

test('tab Speaking có mode Phát âm và panel riêng ẩn mặc định', () => {
  assert.match(html, /<button type="button" data-mode="pron">Phát âm<\/button>/);
  assert.match(html, /<div class="card" id="speak-pron" hidden>/);
  assert.match(html, /id="pronSource"[^>]+aria-label="Nguồn câu luyện phát âm"/);
  assert.match(html, /<option value="sentences">Câu mẫu<\/option>/);
  assert.match(html, /<option value="words">Từ đã học<\/option>/);
  assert.match(html, /<script src="pron-core.cjs"><\/script>/);
});

test('panel phát âm có đủ nút nghe/nói/chọn câu và vùng kết quả có aria', () => {
  assert.match(html, /id="pronPlay"/);
  assert.match(html, /id="pronMic"[^>]+aria-pressed="false"/);
  assert.match(html, /id="pronNext"/);
  assert.match(html, /id="pronStatus"[^>]+role="status"/);
  assert.match(html, /id="pronWords"[^>]+aria-label="So từng từ với câu mục tiêu"/);
  assert.match(html, /id="pronScoreText"[^>]+aria-live="polite"/);
});

test('luồng phát âm dùng speech adapter chung và chấm từng từ bằng Pron core', () => {
  assert.match(learningJs, /async function pronRecord\(\)[\s\S]+LV\.listenOnce/);
  assert.match(learningJs, /window\.Pron\.align\(it\.text, heard, LV\.language\)/);
  assert.match(learningJs, /window\.Pron\.score\(aligned\)/);
  assert.match(learningJs, /fetch\('\/api\/pronunciation\/feedback'/);
  assert.match(coreJs, /typeof module === 'object' && module\.exports/);
});

test('phát âm sai ghi sổ lỗi và luyện từ đã học thì chấm SRS', () => {
  assert.match(learningJs, /addMistake\('speaking', `Phát âm: “\$\{it\.text\}”`/);
  assert.match(learningJs, /srsRecord\(it\.id, LV\.language, scoreNum >= 85 \? 3 : scoreNum >= 60 \? 2 : 1, 'speaking'\)/);
  assert.match(learningJs, /recordActivity\(1, 1\)/);
});

test('chuyển mode Speaking hiện/ẩn đúng panel phát âm', () => {
  assert.match(learningJs, /\$\('#speak-pron'\)\.hidden = mode !== 'pron'/);
});

test('CSS phát âm dùng design token, có trạng thái đúng/sai/thiếu và touch-target', () => {
  assert.match(css, /\.pron-ok\s*\{[^}]+var\(--accent-soft\)/);
  assert.match(css, /\.pron-wrong\s*\{[^}]+var\(--destructive-soft\)/);
  assert.match(css, /\.pron-missing\s*\{[^}]+var\(--muted\)/);
  assert.match(css, /\.pron-score-bar span \{[^}]+var\(--stage-accent\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]+\.pron-score-bar span \{ transition: none/);
});

test('thẻ từ trong phiên học có khu luyện đọc/nói (từ hoặc câu mẫu) + AI sửa', () => {
  assert.match(html, /<div class="vs-pron" id="vsPron"/);
  assert.match(html, /id="vsPronTargets"[^>]+role="group"/);
  assert.match(html, /<button type="button" class="active" data-target="word" aria-pressed="true">Từ<\/button>/);
  assert.match(html, /<button type="button" data-target="sentence" aria-pressed="false">Câu mẫu<\/button>/);
  assert.match(html, /id="vsPronMic"[^>]+aria-pressed="false"/);
  assert.match(html, /id="vsPronWords"[^>]+aria-label="So từng từ với nội dung mục tiêu"/);
  assert.match(learningJs, /vsPronReset\(v\); \/\/ luyện đọc\/nói ngay trên thẻ giới thiệu/);
  assert.match(learningJs, /vsPronReset\(cur\.item\); \/\/ sau khi lật đáp án cũng có thể luyện đọc\/nói/);
  assert.match(learningJs, /async function vsPronRecord\(\)[\s\S]+LV\.listenOnce/);
  assert.match(learningJs, /window\.Pron\.align\(target, heard, LV\.language\)/);
  assert.match(learningJs, /fetch\('\/api\/pronunciation\/feedback'/);
  assert.match(learningJs, /\$\('#vsPronMic'\)\.addEventListener\('click', vsPronRecord\)/);
  // Nghe mẫu đọc theo mục tiêu đang chọn (từ hoặc câu mẫu); "Nghe từ" đọc từ đơn
  assert.match(html, /id="vsPronPlay"[^>]+aria-label="Nghe mẫu nội dung đang luyện"/);
  assert.match(learningJs, /\$\('#vsPronPlay'\)\.addEventListener\('click'[\s\S]+vsPronTargetText\(\)/);
  assert.match(learningJs, /const target = vsPronTargetText\(\);/);
  assert.match(learningJs, /LV\.playText\(cur\.item\.term, LV\.language/);
  // Space trên nút mic đang focus không được lột thành "Đã hiểu"
  assert.match(learningJs, /INPUT\|TEXTAREA\|SELECT\|BUTTON/);
  assert.match(css, /\.vs-pron\s*\{[^}]+var\(--border\)/);
});
