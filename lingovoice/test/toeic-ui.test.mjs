// Test UI Thi thử TOEIC + helper db/toeic.mjs (regex trên source như các *-ui test khác)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
const learning = await readFile(new URL('../public/learning.js', import.meta.url), 'utf8');
const toeicJs = await readFile(new URL('../public/toeic.js', import.meta.url), 'utf8');
const shell = await readFile(new URL('../public/lv-shell.js', import.meta.url), 'utf8');
const api = await readFile(new URL('../public/lv-api.js', import.meta.url), 'utf8');
const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
const apiSpec = await readFile(new URL('../docs/api-spec.md', import.meta.url), 'utf8');
const dataModel = await readFile(new URL('../docs/data-model.md', import.meta.url), 'utf8');
const { normalizeToeicSubmit, byKindFromAttempts, scoreOf, aggregateToeicHistory } = await import('../db/toeic.mjs');

test('tab Thi thử có đủ panes: home (chọn đề/thời lượng), run (đồng hồ/bài làm), result (điểm/xem lại)', () => {
  assert.match(html, /id="tab-toeic"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /data-skill="toeic"[^>]*>Thi thử</);
  assert.match(html, /id="toeicHome"/);
  assert.match(html, /id="toeicDuration"/);
  assert.match(html, /data-min="10"/);
  assert.match(html, /data-min="15"/);
  assert.match(html, /data-min="30"/);
  assert.match(html, /id="toeicForms"/);
  assert.match(html, /id="toeicStart"/);
  assert.match(html, /id="toeicRun"/);
  assert.match(html, /id="toeicTimer"/);
  assert.match(html, /id="toeicTimeFill"/);
  assert.match(html, /id="toeicQChoices"/);
  assert.match(html, /id="toeicDots"/);
  assert.match(html, /id="toeicSubmitBtn"/);
  assert.match(html, /id="toeicResult"/);
  assert.match(html, /id="toeicScoreVal"/);
  assert.match(html, /id="toeicReviewList"/);
  assert.match(html, /id="toeicSkillGrid"/);
  assert.match(html, /id="toeicHistoryList"/);
  // script nạp đúng thứ tự: core trước UI, toeic.js sau lv-shell
  assert.match(html, /<script src="toeic-core\.cjs"><\/script>[\s\S]*<script src="learning\.js"><\/script>/);
  assert.match(html, /<script src="lv-shell\.js"><\/script>\s*<script src="toeic\.js"><\/script>/);
});

test('CTA cuối buổi: tổng kết phiên học từ mới có nút Thi thử, bấm sang tab toeic', () => {
  assert.match(html, /id="vsSumTest"[^>]*>Thi thử cuối buổi</);
  assert.match(learning, /SKILLS = \[[^\]]*'toeic'\]/);
  assert.match(learning, /name === 'toeic'\) \{ try \{ window\.LVToeic\?\.showHome\(\); \} catch \{\} \}/);
  assert.match(learning, /#vsSumTest'\)\.addEventListener\('click', \(\) => switchTab\('toeic'\)\)/);
});

test('toeic.js: sinh đề từ từ đã học + SRS, nộp bài qua LVApi, khách vẫn lưu local', () => {
  assert.match(toeicJs, /Toe\.buildTest\(\{/);
  assert.match(toeicJs, /srsItems: \(store\.srs\.items \|\| \{\}\)\.en \|\| \{\}/);
  assert.match(toeicJs, /vocabItems\('en'\)/);
  assert.match(toeicJs, /LVApi\.toeicSubmit\(/);
  assert.match(toeicJs, /LVShell\.isLoggedIn/);
  assert.match(toeicJs, /LVShell\.applySummary/);
  assert.match(toeicJs, /recordActivity\(minutes, 0\)/);
  assert.match(toeicJs, /localStorage\.setItem\(KEY/);
  assert.match(toeicJs, /'lv-toeic'/);
  // hết giờ tự nộp
  assert.match(toeicJs, /state\.remaining <= 0/);
  assert.match(toeicJs, /submitTest\(true\)/);
});

test('lv-api + lv-shell mở hook cho thi thử; styles có class riêng không đụng token chung', () => {
  assert.match(api, /toeicSubmit: \(payload\) => call\('POST', '\/api\/toeic\/submit', payload\)/);
  assert.match(api, /toeicHistory: \(\) => call\('GET', '\/api\/toeic\/history'\)/);
  assert.match(shell, /isLoggedIn: \(\) => !!gam\.user/);
  assert.match(shell, /applySummary: applyGamification/);
  for (const cls of ['.toeic-form-chip', '.toeic-timer', '.toeic-time-fill', '.toeic-choice', '.toeic-dot', '.toeic-score-ring', '.toeic-skill-fill', '.toeic-review-row']) {
    assert.match(css, new RegExp(cls.replace('.', '\\.') + ' \\{'), `thiếu ${cls}`);
  }
  assert.match(css, /\.toeic-timer\.warn \{/, 'đồng hồ đỏ khi sắp hết giờ');
});

test('server: 2 route toeic wired đúng (validate input, có test tương ứng)', () => {
  assert.match(server, /pathname === '\/api\/toeic\/submit'/);
  assert.match(server, /pathname === '\/api\/toeic\/history'/);
  assert.match(server, /normalizeToeicSubmit/);
  assert.match(server, /createLearningSession\(/);
  assert.match(server, /'TOEIC_INVALID'/);
});

test('docs: api-spec có §3b toeic, data-model ghi key lv-toeic client-only', () => {
  assert.match(apiSpec, /\/api\/toeic\/submit/);
  assert.match(apiSpec, /\/api\/toeic\/history/);
  assert.match(dataModel, /lv-toeic/);
});

/* ---- db/toeic.mjs: chuẩn hoá payload + gộp lịch sử (thuần function) ---- */

test('normalizeToeicSubmit: attempts là nguồn chân lý, clamp form/thời lượng', () => {
  const p = normalizeToeicSubmit({
    day: '2026-09-07',
    form: 99, durationMin: 45, usedSec: 999999,
    attempts: [
      { kind: 'reading', itemRef: 'en-b1-agenda', correct: true },
      { kind: 'listening', correct: false },
      { kind: 'voodoo', correct: true }, // kind lạ -> vocab
      'rác'
    ]
  }, { todayKey: '2026-09-07' });
  assert.equal(p.form, 50, 'form kẹp về 50');
  assert.equal(p.durationMin, 10, 'thời lượng lạ về mặc định 10');
  assert.equal(p.usedSec, 3 * 3600, 'giới hạn 3 giờ');
  assert.equal(p.attempts.length, 3, 'bỏ item rác');
  assert.deepEqual(p.attempts[2], { kind: 'vocab', itemRef: null, correct: true, lang: 'en' });
  // day sai định dạng -> hôm nay
  assert.equal(normalizeToeicSubmit({ day: '31-12-2026' }, { todayKey: '2026-09-07' }).day, '2026-09-07');
});

test('byKindFromAttempts + scoreOf: gộp đúng theo kind, điểm làm tròn %', () => {
  const byKind = byKindFromAttempts([
    { kind: 'vocab', correct: true }, { kind: 'vocab', correct: false },
    { kind: 'listening', correct: true }
  ]);
  assert.deepEqual(byKind.vocab, { total: 2, correct: 1 });
  assert.deepEqual(byKind.listening, { total: 1, correct: 1 });
  assert.deepEqual(byKind.reading, { total: 0, correct: 0 });
  assert.equal(scoreOf(15, 18), 83);
  assert.equal(scoreOf(0, 0), 0);
});

test('aggregateToeicHistory: điểm TB/cao nhất/xu hướng + kỹ năng tích lũy theo kind', () => {
  const rows = [
    { id: 'b', started_at: '2026-09-07T02:00:00Z', stats: { form: 2, durationMin: 15, usedSec: 600, total: 18, correct: 12, score: 67, byKind: { vocab: { total: 6, correct: 5 }, reading: { total: 6, correct: 3 }, listening: { total: 6, correct: 4 } } } },
    { id: 'a', started_at: '2026-09-06T02:00:00Z', stats: { form: 1, durationMin: 10, usedSec: 420, total: 12, correct: 6, score: 50, byKind: { vocab: { total: 4, correct: 2 }, reading: { total: 4, correct: 2 }, listening: { total: 4, correct: 2 } } } }
  ];
  const report = aggregateToeicHistory(rows);
  assert.equal(report.stats.tests, 2);
  assert.equal(report.stats.avgScore, 59);
  assert.equal(report.stats.bestScore, 67);
  assert.equal(report.stats.minutes, 17);
  assert.equal(report.stats.recentAvgScore, 59, 'chưa đủ 5 đề -> gần nhất là tất cả');
  assert.equal(report.stats.previousAvgScore, null, 'không có mốc so sánh khi < 5 đề');
  assert.deepEqual(report.skills.vocab, { total: 10, correct: 7 });
  assert.equal(report.history[0].id, 'b', 'mới nhất trước');
  assert.deepEqual(report.history[0].byKind.vocab, { total: 6, correct: 5 }, 'mỗi dòng history mang byKind cho client gộp kỹ năng');
  assert.deepEqual(aggregateToeicHistory([]).stats, { tests: 0, avgScore: 0, bestScore: 0, minutes: 0, recentAvgScore: null, previousAvgScore: null });
});
