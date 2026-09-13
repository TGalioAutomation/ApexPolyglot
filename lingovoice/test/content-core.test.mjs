// Unit test content-core (UMD dùng chung browser + Node) — hành vi gộp nội dung DB vào literal
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CC = require('../public/content-core.cjs');

test('sanitizeLessons: giữ chủ đề hợp lệ, lọc câu thiếu text/vi, bỏ chủ đề rỗng', () => {
  const clean = CC.sanitizeLessons([
    { topic: 'Chào hỏi', sentences: [
      { id: 'a', text: 'Hello', vi: 'Xin chào' },
      { text: 'Thiếu vi' },                    // lọc
      { id: 'b', text: 'Hi', vi: 'Chào', pinyin: 'hai' }
    ] },
    { topic: 'Rỗng', sentences: [] },          // bỏ
    { topic: '', sentences: [{ text: 'x', vi: 'y' }] } // bỏ (topic rỗng)
  ]);
  assert.equal(clean.length, 1);
  assert.equal(clean[0].topic, 'Chào hỏi');
  assert.equal(clean[0].sentences.length, 2);
  assert.equal(clean[0].sentences[0].id, 'a');
  assert.equal(clean[0].sentences[1].pinyin, 'hai');
  assert.equal(CC.sanitizeLessons('không phải mảng'), null);
  assert.equal(CC.sanitizeLessons([{ topic: 'x', sentences: [] }]), null);
});

test('sanitizeReadings: giữ cấp 1-7, bài phải có title + paragraphs string, câu hỏi lọc dị dạng', () => {
  const clean = CC.sanitizeReadings({
    1: [{ id: 'r-1', title: 'My Morning', paragraphs: ['A', 'B'], questions: [{ q: 'Q?', options: ['a', 'b'], answer: 0 }, { q: 'bad' }] }],
    9: [{ title: 'Cấp sai', paragraphs: ['x'] }], // bỏ cấp 9
    2: []                                          // bỏ mảng rỗng
  });
  assert.deepEqual(Object.keys(clean), ['1']);
  assert.equal(clean['1'][0].questions.length, 1);
  assert.equal(clean['1'][0].level, 1);
  assert.equal(CC.sanitizeReadings([1, 2]), null);
  assert.equal(CC.sanitizeReadings({}), null);
});

test('sanitizeRoleplay: giữ {id,title,vi} đủ trường, lọc thiếu', () => {
  const clean = CC.sanitizeRoleplay([
    { id: 'restaurant', title: 'At the restaurant', vi: 'Nhà hàng' },
    { id: 'x', title: 'Thiếu vi' }
  ]);
  assert.equal(clean.length, 1);
  assert.equal(clean[0].id, 'restaurant');
  assert.equal(CC.sanitizeRoleplay([]), null);
});

test('apply* mutate literal in place và trả false khi dữ liệu không thay thế được', () => {
  const LESSONS = { en: [{ topic: 'Gốc', sentences: [{ id: 'g1', text: 'Old', vi: 'Cũ' }] }] };
  assert.equal(CC.applyLessons(LESSONS, 'en', [{ topic: 'Mới', sentences: [{ id: 'n1', text: 'New', vi: 'Mới' }] }]), true);
  assert.equal(LESSONS.en[0].topic, 'Mới');
  assert.equal(CC.applyLessons(LESSONS, 'en', []), false);      // rỗng -> giữ nguyên
  assert.equal(LESSONS.en[0].topic, 'Mới');
  assert.equal(CC.applyLessons(LESSONS, 'fr', [{ topic: 't', sentences: [{ text: 'a', vi: 'b' }] }]), false); // lang lạ

  const READING_TEXTS = { en: { 1: [{ id: 'r', level: 1, title: 'T', paragraphs: ['p'], questions: [] }] } };
  assert.equal(CC.applyReadings(READING_TEXTS, 'en', { 2: [{ id: 'r2', title: 'T2', paragraphs: ['p2'], questions: [] }] }), true);
  assert.ok(READING_TEXTS.en['2']);
  assert.equal(CC.applyReadings(READING_TEXTS, 'en', null), false);

  const ROLEPLAY = [{ id: 'old', title: 'Old', vi: 'Cũ' }];
  assert.equal(CC.applyRoleplay(ROLEPLAY, [{ id: 'new', title: 'New', vi: 'Mới' }]), true);
  assert.equal(ROLEPLAY.length, 1);
  assert.equal(ROLEPLAY[0].id, 'new');
  assert.equal(CC.applyRoleplay(ROLEPLAY, 'junk'), false);
  assert.equal(ROLEPLAY[0].id, 'new');
});
