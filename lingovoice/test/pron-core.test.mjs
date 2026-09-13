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

test('align nhận từ nghe lệch một âm là wrong (schedule → skedule)', () => {
  const aligned = Pron.align('I have a busy schedule today.', 'I have a busy skedule today', 'en');
  const wrong = aligned.filter((a) => a.status === 'wrong');
  assert.equal(wrong.length, 1);
  assert.equal(wrong[0].word, 'schedule');
  assert.equal(wrong[0].heard, 'skedule');
});

test('align nhận từ bị bỏ qua là missing', () => {
  const aligned = Pron.align('Good morning teacher', 'good teacher', 'en');
  assert.equal(aligned.find((a) => a.status === 'missing')?.word, 'morning');
});

test('align tiếng Trung so theo chữ và bắt chữ sai', () => {
  const aligned = Pron.align('我每天学习中文。', '我每添学习中文', 'zh');
  const wrong = aligned.filter((a) => a.status === 'wrong');
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

test('wrongWords ưu tiên từ sai rồi từ thiếu, giới hạn 4', () => {
  const aligned = Pron.align('one two three four five six', 'von too three four five six', 'en');
  const words = Pron.wrongWords(aligned);
  assert.ok(words.length <= 4);
  assert.equal(words[0].status, 'wrong');
  const missing = Pron.align('a b c d e f g h', 'a b c', 'en');
  assert.deepEqual(Pron.wrongWords(missing).map((w) => w.word), ['d', 'e', 'f', 'g']);
});

test('similarity đo độ giống chuỗi', () => {
  assert.equal(Pron.similarity('hello', 'hello'), 1);
  assert.ok(Pron.similarity('schedule', 'skedule') > 0.7 && Pron.similarity('schedule', 'skedule') < 1);
  assert.equal(Pron.similarity('a', ''), 0);
});
