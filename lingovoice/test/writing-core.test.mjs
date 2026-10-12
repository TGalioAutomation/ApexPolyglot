import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const WritingCore = require('../public/writing-core.cjs');

test('writing comparison only accepts the correct word order', () => {
  const target = 'The company made a large profit this year.';
  assert.equal(WritingCore.compareText(target, target, 'en').exact, true);

  const screenshotError = WritingCore.compareText('The company made profit this large a year.', target, 'en');
  assert.equal(screenshotError.exact, false);
  assert.ok(screenshotError.positionAccuracy < 0.75);
  assert.equal(screenshotError.wordAccuracy, 1, 'all words may be present while their order is still wrong');
});

test('English chunks reconstruct the original sentence in manageable groups', () => {
  const target = 'The company made a large profit this year.';
  const chunks = WritingCore.createChunks(target, 'en');
  assert.ok(chunks.length >= 3 && chunks.length <= 5);
  assert.equal(chunks.join(' '), target);
});

test('Chinese chunks reconstruct without inserting spaces', () => {
  const target = '我每天早上学习中文。';
  const chunks = WritingCore.createChunks(target, 'zh');
  assert.equal(chunks.join(''), target);
  assert.ok(chunks.length > 1);
});

test('chunk shuffle never leaves a multi-chunk exercise in source order', () => {
  const shuffled = WritingCore.shuffleChunks(['one', 'two', 'three'], () => 0.999);
  assert.notDeepEqual(shuffled.map((chunk) => chunk.order), [0, 1, 2]);
  assert.deepEqual(shuffled.map((chunk) => chunk.text).sort(), ['one', 'three', 'two']);
});
