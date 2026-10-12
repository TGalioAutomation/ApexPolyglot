import assert from 'node:assert/strict';
import { scoreAssessment, publicQuestions, deterministicRequirements } from '../dist/assessment.js';
import { sanitizeTutorText, sanitizeLesson, sanitizeRequirements, extractJson } from '../dist/ai.js';

const answers = [
  { id: 'en-meaning-1', answer: 0 },
  { id: 'en-listen-1', answer: 1 },
  { id: 'en-grammar-1', answer: 1 },
  { id: 'en-reading-2', answer: 1 },
  { id: 'en-speak-1', answer: 'I am Minh and my goal is to learn English for work and travel every day' },
  { id: 'en-speak-2', answer: 'I do not understand. Could you please repeat that more slowly so I can understand you?' }
];
const result = scoreAssessment('en', answers);
assert.equal(result.overall, 100);
assert.equal(result.estimatedLevel, 7);
assert.equal(result.evidenceStatus, 'preliminary');
assert.equal(result.evidence.length, 6);

const pub = publicQuestions('en');
assert.equal(pub.length, 6);
assert.equal('answer' in pub[0], false);
assert.equal('minWords' in pub[0], false);

const plan = deterministicRequirements(result, 'en', 'placement');
assert.equal(plan.requirements.length, 3);

assert.equal(sanitizeTutorText('  hello world  '), 'hello world');
assert.equal(sanitizeTutorText('\u0000raw'), null);
assert.equal(sanitizeTutorText('api_key: secret'), null);

assert.deepEqual(sanitizeLesson({ title: 'T', prompt: 'P', tip: 'Tip' }), { title: 'T', prompt: 'P', tip: 'Tip' });
assert.equal(sanitizeLesson({ title: 'T', prompt: 'P' }), null);
assert.equal(sanitizeLesson({ title: 'T', prompt: 'P', tip: 'Tip', extra: 1 }), null);

const validReqs = { summary: 's', requirements: [1, 2, 3].map((n) => ({ title: `t${n}`, minutes: 10, successCriterion: 'c' })), nextCheckpoint: 'n', promotionRule: 'p' };
assert.equal(sanitizeRequirements(validReqs)?.requirements.length, 3);
assert.equal(sanitizeRequirements({ ...validReqs, requirements: [1, 2] }), null);
assert.equal(sanitizeRequirements({ ...validReqs, requirements: [1, 2, 3].map((n) => ({ title: `t${n}`, minutes: 99, successCriterion: 'c' })) }), null);

assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });

console.log('TypeScript shell tests passed');
