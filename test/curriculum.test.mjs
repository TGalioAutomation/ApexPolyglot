import assert from 'node:assert/strict';
import { getTodayPlan } from '../dist/curriculum/service.js';
import { seedCurriculum } from '../dist/curriculum/service.js';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping curriculum integration tests');
  process.exit(0);
}

const seeded = await seedCurriculum(dbUrl);
assert.ok(seeded.course);
assert.equal(seeded.version, 1);
assert.equal(seeded.units, 0, 're-seed should be idempotent (no new units)');

const plan = await getTodayPlan(dbUrl, 'en', 1);
assert.ok(plan, 'expected a plan for day 1');
assert.equal(plan.length, 4);
assert.deepEqual(plan.map((item) => item.type), ['listening', 'reading', 'speaking', 'review']);
for (const item of plan) {
  assert.ok(item.lessonId);
  assert.ok(item.estimatedMinutes > 0);
  assert.ok(item.content.day === 1);
}

const late = await getTodayPlan(dbUrl, 'en', 90);
assert.equal(late.length, 4);
const missing = await getTodayPlan(dbUrl, 'en', 91);
assert.equal(missing, null);

console.log('curriculum integration tests passed');
