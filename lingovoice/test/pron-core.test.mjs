// Unit test cho Pron core — so transcript STT với câu mục tiêu (không cần server)
import test from 'node:test';
import assert from 'node:assert/strict';
import Pron from '../public/pron-core.cjs';

test('tokenize tách từ tiếng Anh, bỏ dấu câu và viết thường', () => {
  assert.deepEqual(Pron.tokenize('Hello, World! How are you?', 'en'), ['hello', 'world', 'how', 'are', 'you']);
  assert.deepEqual(Pron.tokenize("I'm fine, aren't I?", 'en'), ["i'm", 'fine', "aren't", 'i']);
});

test('tokenize tách từng chữ Hán cho tiếng Trung, bỏ dấu câu và latin', () => {
  assert.deepEqual(Pron.tokenize('我每天学习中文。', 'zh'), ['我', '每', '天', '学', '习', '中', '文']);
  assert.deepEqual(Pron.tokenize('你好 Ni hao！', 'zh'), ['你', '好']);
});

test('align: lệch một âm nhưng người nghe vẫn nhận ra từ = close (schedule → skedule)', () => {
  const aligned = Pron.align('I have a busy schedule today.', 'I have a busy skedule today', 'en');
  const close = aligned.filter((a) => a.status === 'close');
  assert.equal(close.length, 1);
  assert.equal(close[0].word, 'schedule');
  assert.equal(close[0].heard, 'skedule');
});

test('align: nghe thành từ khác hẳn = miss (người nghe sẽ hiểu nhầm)', () => {
  // morning/evening có đuôi "-ning" chung nên vẫn tính close — phải dùng từ không còn điểm nào giống
  const aligned = Pron.align('Good morning', 'good banana', 'en');
  const miss = aligned.filter((a) => a.status === 'miss');
  assert.equal(miss.length, 1);
  assert.equal(miss[0].word, 'morning');
});

test('align nhận từ bị bỏ qua là missing', () => {
  const aligned = Pron.align('Good morning teacher', 'good teacher', 'en');
  assert.equal(aligned.find((a) => a.status === 'missing')?.word, 'morning');
});

test('align tiếng Trung so theo chữ và bắt chữ sai', () => {
  const aligned = Pron.align('我每天学习中文。', '我每添学习中文', 'zh');
  const wrong = aligned.filter((a) => a.status === 'miss');
  assert.equal(wrong.length, 1);
  assert.equal(wrong[0].word, '天');
  assert.equal(wrong[0].heard, '添');
});

test('score: đúng hết 100, sai một từ nhiều từ vẫn còn điểm cao, trống 0', () => {
  assert.equal(Pron.score(Pron.align('Good morning', 'good morning', 'en')), 100);
  // "schedule" nghe thành "skedule" giống ~75% → 6 từ đúng + 0.75 điểm từ sai / 6 từ = 96
  assert.equal(Pron.score(Pron.align('I have a busy schedule today.', 'I have a busy skedule today', 'en')), 96);
  assert.equal(Pron.score(Pron.align('Good morning', '', 'en')), 0);
});

test('score: từ sai chấm theo độ giống thật — lệch nhẹ điểm cao hơn sai hẳn', () => {
  // nói "ship" nghe thành "sheep" (giống 60% theo Levenshtein chuẩn hóa) phải hơn điểm nói thành từ không liên quan
  assert.equal(Pron.score(Pron.align('ship', 'sheep', 'en')), 60);
  assert.equal(Pron.score(Pron.align('hello', 'xyz', 'en')), 0);
  assert.ok(Pron.score(Pron.align('ship', 'sheep', 'en')) > Pron.score(Pron.align('hello', 'xyz', 'en')));
});

test('align chia 3 mức theo ngưỡng người nghe hiểu: ok ≥0.9, close ≥0.5, miss <0.5', () => {
  const levels = Pron.align('cat hat dog', 'cap hop dog', 'en');
  const byWord = Object.fromEntries(levels.map((a) => [a.word, a.status]));
  assert.equal(byWord.cat, 'close');  // cat→cap giống 67%
  assert.equal(byWord.hat, 'miss');   // hat→hop giống 33%
  assert.equal(byWord.dog, 'ok');
});

test('wrongWords ưu tiên miss → close → missing, giới hạn 4', () => {
  const aligned = Pron.align('one two three four five six', 'von too three four five six', 'en');
  const words = Pron.wrongWords(aligned);
  assert.ok(words.length <= 4);
  // "one" nghe thành "von" (giống 33% = miss) xếp trước "two"→"too" (giống 67% = close)
  assert.equal(words[0].status, 'miss');
  assert.equal(words[0].word, 'one');
  assert.ok(words.some((w) => w.word === 'two' && w.status === 'close'));
  const missing = Pron.align('a b c d e f g h', 'a b c', 'en');
  assert.deepEqual(Pron.wrongWords(missing).map((w) => w.word), ['d', 'e', 'f', 'g']);
});

test('similarity đo độ giống chuỗi', () => {
  assert.equal(Pron.similarity('hello', 'hello'), 1);
  assert.ok(Pron.similarity('schedule', 'skedule') > 0.7 && Pron.similarity('schedule', 'skedule') < 1);
  assert.equal(Pron.similarity('a', ''), 0);
});
