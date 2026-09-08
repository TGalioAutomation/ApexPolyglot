import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditFile } from '../scripts/audit-vocab.mjs';

const [en, zh, html, learning] = await Promise.all([
  auditFile(new URL('../data/vocab-en.json', import.meta.url), 'en'),
  auditFile(new URL('../data/vocab-zh.json', import.meta.url), 'zh'),
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/learning.js', import.meta.url), 'utf8')
]);

test('prepared vocabulary datasets pass schema and uniqueness audit', () => {
  assert.deepEqual(en.errors, []);
  assert.deepEqual(zh.errors, []);
  assert.equal(en.total, 150);
  assert.equal(zh.total, 40);
  assert.deepEqual(en.levels, { A1: 30, A2: 50, B1: 62, B2: 8, C1: 0, C2: 0 });
  assert.deepEqual(zh.levels, { A1: 15, A2: 14, B1: 10, B2: 1, C1: 0, C2: 0 });
});

test('Vocabulary Studio exposes dataset coverage before the list', () => {
  assert.match(html, /id="vsDataCoverage"/);
  assert.ok(html.indexOf('id="vsDataCoverage"') < html.indexOf('id="vsBankList"'));
  assert.match(html, /id="vsCefrFilter"/);
  assert.match(html, /id="vsBankCount"/);
  assert.match(learning, /Nguồn dữ liệu đang sử dụng/);
  assert.match(learning, /Human-reviewed:/);
});

test('prepared JSON is primary and inline vocabulary is fallback only', () => {
  assert.match(learning, /vocabDataState\[lang\]\.status === 'ready'[\s\S]*extVocab\[lang\]/);
  assert.match(learning, /status === 'error' \? fallbackVocab\(lang\) : \[\]/);
  assert.match(learning, /Chỉ render danh sách sau khi đã biết chính xác trạng thái dataset/);
  assert.match(learning, /Xem \$\{available\} từ \$\{l\.code\} đang có/);
});

test('phiên học từ mới nêu rõ số lượng ngay từ đầu + câu mẫu + kiểm tra tích lũy', () => {
  // briefing hiện số từ trước khi vào phiên
  assert.match(html, /id="vstudio-brief"/);
  assert.match(html, /id="vsBriefCount"/);
  assert.match(html, /id="vsBriefBatch"/);
  assert.match(html, /id="vsBriefStart"/);
  assert.ok(html.indexOf('id="vstudio-brief"') < html.indexOf('id="vstudio-session"'), 'briefing phải trước phiên học');
  // trong phiên: mỗi từ mới kèm câu mẫu, có bước kiểm tra tích lũy và màn tổng kết
  assert.match(html, /id="vsUnderstood"/);
  assert.match(html, /id="vsStepBadge"/);
  assert.match(html, /id="vstudio-summary"/);
  assert.match(learning, /SRS\.buildLearnSteps/);
  assert.match(learning, /Kiểm tra tích lũy/);
  assert.match(learning, /lv-learn-batch/);
  assert.match(learning, /mỗi từ kèm 1 câu mẫu/);
});

test('nhấn giữ từ / câu mẫu trên thẻ mở chi tiết: nghĩa, cách dùng, nghe, đọc thử', () => {
  // hai vùng chạm trên thẻ đều có hint và được chống chọn chữ/menu hệ thống khi giữ
  assert.match(html, /id="vsTerm"[^>]+title="Nhấn giữ để xem nghĩa, cách dùng, nghe và đọc thử"/);
  assert.match(html, /id="vsExample"[^>]+title="Nhấn giữ để xem nghĩa, cách dùng, nghe và đọc thử"/);
  // helper long-press: 450ms, hủy khi rời tay/di chuyển, rung phản hồi, chặn click sau khi kích hoạt
  assert.match(learning, /function vsBindLongPress\(el, getItem\)/);
  assert.match(learning, /setTimeout\([\s\S]{0,200}450\)/);
  assert.match(learning, /navigator\.vibrate/);
  assert.match(learning, /contextmenu', \(e\) => e\.preventDefault/);
  assert.match(learning, /vsBindLongPress\(\$\('#vsTerm'\), \(\) => vs\.currentItem\)/);
  assert.match(learning, /vsBindLongPress\(\$\('#vsExample'\), \(\) => vs\.currentItem\)/);
  // từ hiện tại được ghi lại ở cả thẻ giới thiệu lẫn thẻ kiểm tra để mở đúng từ
  assert.match(learning, /function vsShowLearnCard\(v, done, total\) \{\n  vs\.currentItem = v;/);
  assert.match(learning, /vs\.revealed = false;\n  const v = cur\.item;\n  vs\.currentItem = v;/);
});

test('trang gói từ vựng: chọn gói theo chủ đề trước khi học', () => {
  assert.match(html, /id="vs-packs"/);
  assert.match(html, /id="vsPackGrid"/);
  assert.match(html, /data-vview="packs"/);
  assert.match(html, /id="vsBriefTopic"/, 'briefing phải có hàng chip gói');
  assert.match(learning, /vsTopicStats/);
  assert.match(learning, /renderVsPacks/);
  assert.match(learning, /lv-learn-topic/);
  assert.match(learning, /Học gói này/);
  // lọc từ mới theo gói đang chọn
  assert.match(learning, /\(!topic \|\| v\.topic === topic\)/);
});

test('chống từ mồ côi SRS: không vào phiên, không đếm, không phiên dở ảo', () => {
  // queue review phải loại thẻ không còn trong kho dữ liệu
  assert.match(learning, /\.filter\(\(q\) => q\.item\); \/\/ từ mồ côi/);
  // đếm "X từ cần ôn" chỉ tính từ còn tồn tại
  assert.match(learning, /const due = dueItems\(lang, 999\)\.length; \/\/ chỉ đếm từ còn tồn tại trong kho/);
  assert.match(learning, /findVocab\(lang, id\) && it\.state !== 'mastered'/);
  // thoát khi phiên rỗng không được ghi lv-session; phiên rỗng không tính là đang dở
  assert.match(learning, /if \(vs\.queue\.length\) vsPersist\(\); \/\/ chỉ giữ lại phiên khi thực sự có nội dung đang dở/);
  assert.match(learning, /Array\.isArray\(s\.ids\) && s\.ids\.length > 0/);
});
