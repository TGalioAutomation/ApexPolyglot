// UI static test — mode "Phát âm" trong tab Speaking (hợp đồng DOM + wiring + style)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/index.html', root), 'utf8');
const learningJs = await readFile(new URL('public/learning.js', root), 'utf8');
const css = await readFile(new URL('public/styles.css', root), 'utf8');
const coreJs = await readFile(new URL('public/pron-core.cjs', root), 'utf8');
const appJs = await readFile(new URL('public/app.js', root), 'utf8');

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
  assert.match(learningJs, /pronBestAlign\(it\.text, heard, heardAlts, LV\.language\)/);
  assert.match(learningJs, /window\.Pron\.score\(aligned\)/);
  assert.match(learningJs, /fetch\('\/api\/pronunciation\/feedback'/);
  // chấm theo bản STT khớp nhất + gửi diff/IPA cho AI để nhận xét không mâu thuẫn bảng so từng từ
  assert.match(learningJs, /function pronBestAlign\(/);
  assert.match(learningJs, /pronBestAlign\(item\.term, heard, heardAlts, lang\)/);
  assert.match(learningJs, /ipa: it\.ipa \|\| ''/);
  assert.match(learningJs, /diff: \(aligned \|\| \[\]\)\.map/);
  assert.match(coreJs, /typeof module === 'object' && module\.exports/);
});

test('phát âm sai ghi sổ lỗi; chỉ từ ĐÃ học mới được chấm SRS (điểm không biến từ chưa học thành đã học)', () => {
  assert.match(learningJs, /addMistake\('speaking', `Phát âm: “\$\{it\.text\}”`/);
  assert.match(learningJs, /it\.kind === 'word' && srsHas\(LV\.language, it\.id\)/);
  assert.match(learningJs, /srsRecord\(it\.id, LV\.language, scoreNum >= 85 \? 3 : scoreNum >= 60 \? 2 : 1, 'speaking'\)/);
  assert.match(learningJs, /recordActivity\(1, 1\)/);
});

test('nguồn "Từ đã học" chỉ lấy từ đã vào sổ SRS, trống thì nhắc học từ mới trước', () => {
  assert.match(learningJs, /vocabItems\(LV\.language\)\.filter\(\(v\) => v\.term && srsHas\(LV\.language, v\.id\)\)/);
  assert.match(learningJs, /Chưa có từ đã học — học từ mới xong quay lại đây luyện nhé\./);
});

test('chuyển mode Speaking hiện/ẩn đúng panel phát âm', () => {
  assert.match(learningJs, /\$\('#speak-pron'\)\.hidden = mode !== 'pron'/);
});

test('CSS phát âm dùng design token, có trạng thái đúng/sai/thiếu và touch-target', () => {
  assert.match(css, /\.pron-ok\s*\{[^}]+var\(--accent-soft\)/);
  assert.match(css, /\.pron-close\s*\{[^}]+#fef3c7/); // amber: nghe hơi khác nhưng vẫn hiểu
  assert.match(css, /\.pron-miss\s*\{[^}]+var\(--destructive-soft\)/);
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
  assert.match(learningJs, /pronBestAlign\(target, heard, heardAlts, LV\.language\)/);
  assert.match(learningJs, /ipa: v\.ipa \|\| ''/);
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

test('sau khi nói có nút "Nghe lại" phát lại chính giọng vừa ghi (cục bộ, không upload)', () => {
  // Nút ẩn mặc định, hiện sau lần nói đầu; aria-label nói rõ đó là giọng của người học
  assert.match(html, /id="vsPronReplay"[^>]+aria-label="Nghe lại giọng bạn vừa đọc"[^>]*hidden/);
  assert.match(html, /id="pronReplay"[^>]+aria-label="Nghe lại giọng bạn vừa nói"[^>]*hidden/);
  // Helper ghi âm MediaRecorder dùng chung; không hỗ trợ thì trả false, luồng chính vẫn chạy
  assert.match(appJs, /function selfRecordSupported\(\)[^}]+MediaRecorder/);
  assert.match(appJs, /getUserMedia\(\{ audio: true \}\)/);
  assert.match(appJs, /selfRecord: \{ supported: selfRecordSupported, start: selfRecordStart, stop: selfRecordStop \}/);
  // Wiring: ghi âm chạy song song với listenOnce, xong thì tạo object URL để phát lại
  assert.match(learningJs, /const recOn = await LV\.selfRecord\.start\(\);[\s\S]{0,400}?const heard = await LV\.listenOnce/);
  assert.match(learningJs, /async function pronRecord\(\)[\s\S]+?recOn \? await LV\.selfRecord\.stop\(\) : ''/);
  assert.match(learningJs, /async function vsPronRecord\(\)[\s\S]+?recOn \? await LV\.selfRecord\.stop\(\) : ''/);
  assert.match(learningJs, /pronReplayInto\('pronReplay', myVoice\)/);
  assert.match(learningJs, /pronReplayInto\('vsPronReplay', myVoice\)/);
  // Đổi mục tiêu / sang thẻ khác / chọn câu khác thì gỡ nút nghe lại
  assert.match(learningJs, /pronReplayInto\('vsPronReplay', ''\)/);
  assert.match(learningJs, /pronReplayInto\('pronReplay', ''\)/);
  // Không rò rỉ object URL: bản ghi mới revoke bản cũ
  assert.match(appJs, /URL\.revokeObjectURL\(selfRecorder\.url\)/);
  // CSS có trạng thái đang phát
  assert.match(css, /\.vs-pron-actions \.playing, \.hero-actions \.playing/);
});

test('popup chi tiết từ (nhấn giữ) có đọc thử: mic + so từng từ + AI mẹo + nghe lại', () => {
  // chi tiết từ mở từ long-press; khối đọc thử dựng động với đủ thành phần
  assert.match(learningJs, /function vsDetailPronBlock\(item\)/);
  assert.match(learningJs, /body\.append\(vsDetailPronBlock\(item\)\); \/\/ đọc thử ngay trong popup/);
  assert.match(learningJs, /btn\.textContent = 'Đọc thử';/);
  assert.match(learningJs, /'Nghe lại giọng bạn vừa đọc'/);
  assert.match(learningJs, /pronBestAlign\(item\.term, heard, heardAlts, lang\)/);
  assert.match(learningJs, /const recOn = await LV\.selfRecord\.start\(\);[\s\S]{0,400}?const heard = await LV\.listenOnce/);
  assert.match(learningJs, /pronReplayInto\(replay, myVoice\)/);
  assert.match(learningJs, /addMistake\('speaking', `Phát âm: “\$\{item\.term\}”`/);
  assert.match(learningJs, /fetch\('\/api\/pronunciation\/feedback'/);
  // nghe trong popup: nghe từ (term) + nghe câu (example) + câu chậm
  assert.match(learningJs, /b0\.textContent = 'Nghe từ';/);
  assert.match(learningJs, /LV\.playText\(item\.term, item\.lang/);
  // chống chọn chữ khi giữ lâu trên thẻ
  assert.match(css, /\.holdable\s*\{[^}]+user-select: none/);
});

test('STT trả nhiều alternatives để chấm phát âm chọn bản khớp nhất (browser + native)', () => {
  assert.match(appJs, /recognition\.maxAlternatives = 5/);
  assert.match(appJs, /callbacks\.onAlternatives\?\./);
  assert.match(appJs, /payload\.alternatives/);
});
