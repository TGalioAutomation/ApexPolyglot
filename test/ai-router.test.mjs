import assert from 'node:assert/strict';
import { routedTutor, acquireBudget, resetBudgetForTest, setBudgetLimit, getBudgetLimit, budgetRemaining } from '../dist/ai/router.js';

resetBudgetForTest();
setBudgetLimit(3);
assert.equal(getBudgetLimit(), 3);

// budget allows 3 requests, 4th is rejected without touching providers
assert.equal(acquireBudget(), true);
assert.equal(acquireBudget(), true);
assert.equal(acquireBudget(), true);
assert.equal(acquireBudget(), false);
assert.equal(budgetRemaining(), 0);

// routedTutor returns graceful fallback when exhausted (no provider called)
resetBudgetForTest();
setBudgetLimit(1);
const first = await routedTutor({ user: 'hello' });
assert.equal(first.provider, 'demo');
const second = await routedTutor({ user: 'hello' });
assert.equal(second.provider, 'demo');
assert.equal(second.model, 'budget-exhausted');
assert.ok(second.errors.some((e) => /budget/i.test(e)));

console.log('AI governance (TADR-005) router & budget tests passed');
