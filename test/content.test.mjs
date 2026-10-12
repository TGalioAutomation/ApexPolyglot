import assert from 'node:assert/strict';
import { generateLessonContent } from '../dist/curriculum/content.js';

// distinct content across days (same type) — no more repeated template
const en1 = generateLessonContent('en', 1, 'listening');
const en2 = generateLessonContent('en', 2, 'listening');
assert.notEqual(en1.title, en2.title);
assert.notEqual(en1.topicKey, en2.topicKey);
assert.notDeepEqual(en1.material.transcript, en2.material.transcript);

// same day, same type returns identical content (deterministic)
assert.deepEqual(generateLessonContent('en', 5, 'reading'), generateLessonContent('en', 5, 'reading'));

// content structure per type
for (const day of [1, 30, 90]) {
  for (const type of ['listening', 'reading', 'speaking', 'review']) {
    const c = generateLessonContent('en', day, type);
    assert.ok(c.title);
    assert.ok(c.outcome);
    assert.ok(c.topic);
    assert.ok(c.vocab.length >= 3);
    assert.equal(c.day, day);
    assert.equal(c.schemaVersion, 1);
  }
}

// Chinese content differs from English
const zh1 = generateLessonContent('zh-CN', 1, 'listening');
assert.notEqual(zh1.title, en1.title);
assert.ok(zh1.material.pinyin, 'Chinese listening should include pinyin');

// level progression: day 1 vs day 31 speaking minutes increase
const speakD1 = generateLessonContent('en', 1, 'speaking');
const speakD31 = generateLessonContent('en', 31, 'speaking');
assert.equal(speakD1.level, 1);
assert.equal(speakD31.level, 2);
assert.ok(speakD31.material.minutes >= speakD1.material.minutes);

// both languages present in seeding targets
assert.equal(generateLessonContent('zh-CN', 45, 'review').vocab.length >= 4, true);

console.log('lesson content generator tests passed');
