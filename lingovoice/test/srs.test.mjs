// LingoVoice — unit test SRS core (Vocabulary Studio)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const SRS = require(join(__dirname, '..', 'public', 'srs-core.cjs'));

test('SRS: 4 mức đánh giá -> trạng thái + interval + due date', () => {
  const now = Date.now();
  const again = SRS.evaluate(SRS.initial(), 1);
  assert.equal(again.state, 'learning');
  assert.equal(again.intervalMs, SRS.MINUTE); // ~1 phút
  assert.ok(again.dueAt > now && again.dueAt <= now + SRS.MINUTE);

  const hard = SRS.evaluate(SRS.initial(), 2);
  assert.equal(hard.state, 'difficult');
  assert.equal(hard.difficult, true);
  assert.equal(hard.intervalMs, SRS.DAY); // 1 ngày

  const good = SRS.evaluate(SRS.initial(), 3);
  assert.equal(good.state, 'review');
  assert.equal(good.intervalMs, 3 * SRS.DAY);

  const easy = SRS.evaluate(SRS.initial(), 5);
  assert.equal(easy.intervalMs, 10 * SRS.DAY);
});

test('SRS: không mastered sau một lượt Dễ; cần 3 lượt tốt liên tiếp', () => {
  const one = SRS.evaluate(SRS.initial(), 5);
  assert.equal(one.state, 'review', '1 lượt Dễ -> review, chưa mastered');
  assert.equal(one.consecutiveGood, 1);
  assert.equal(one.mastered, false);

  const two = SRS.evaluate({ state: 'review', reps: 1, consecutiveGood: 1 }, 5);
  assert.equal(two.mastered, false);

  const three = SRS.evaluate({ state: 'review', reps: 2, consecutiveGood: 2 }, 5);
  assert.equal(three.state, 'mastered', '3 lượt tốt liên tiếp -> mastered');
  assert.equal(three.mastered, true);
  assert.equal(three.dueAt, null, 'mastered không còn hạn ôn');

  // đứt chuỗi: đánh Lại sau 2 lượt tốt -> về learning, chưa mastered
  const broken = SRS.evaluate({ state: 'review', reps: 2, consecutiveGood: 2 }, 1);
  assert.equal(broken.consecutiveGood, 0);
  assert.equal(broken.state, 'learning');
});

test('SRS: nhãn interval dễ hiểu', () => {
  assert.equal(SRS.intervalLabel(SRS.MINUTE), '1 phút');
  assert.equal(SRS.intervalLabel(SRS.DAY), '1 ngày');
  assert.equal(SRS.intervalLabel(3 * SRS.DAY), '3 ngày');
  assert.equal(SRS.intervalLabel(10 * SRS.DAY), '10 ngày');
  assert.equal(SRS.gradeIntervalLabel(1), '1 phút');
  assert.equal(SRS.gradeIntervalLabel(3), '3 ngày');
});

test('SRS: kết thúc session -> summary (số ôn, nhớ tốt, cần học lại)', () => {
  const records = [
    { grade: 5 }, { grade: 3 }, { grade: 1 }, { grade: 2 }
  ];
  const sum = SRS.summarize(records);
  assert.equal(sum.total, 4);
  assert.equal(sum.good, 2, 'Dễ(5)+Tốt(3) = 2 nhớ tốt');
  assert.equal(sum.again, 1, 'Lại(1) = 1 cần học lại');
  assert.equal(sum.relearn, 1);
});

test('SRS: stats đếm trạng thái + due', () => {
  const now = Date.now();
  const map = {
    a: { state: 'new', dueAt: null },
    b: { state: 'review', dueAt: now - 1000 },
    c: { state: 'mastered', dueAt: null },
    d: { state: 'difficult', dueAt: now + SRS.DAY, difficult: true }
  };
  const st = SRS.stats(map);
  assert.equal(st.new, 1);
  assert.equal(st.review, 1);
  assert.equal(st.mastered, 1);
  assert.equal(st.difficult, 1);
  assert.equal(st.due, 2); // a (due null) + b (quá hạn); d due tương lai không đếm
});
