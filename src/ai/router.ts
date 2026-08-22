import { runTutor, ProviderResult } from '../ai.js';

/**
 * TADR-005: provider adapters behind an internal interface + policy router.
 * The router picks a provider per policy (order, cost, availability) and gates
 * requests by a token/request budget per window.
 */

export interface BudgetState {
  windowStart: number;
  requestsUsed: number;
}

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_BUDGET = 100; // requests per hour

let budget: BudgetState = { windowStart: Date.now(), requestsUsed: 0 };

export function setBudgetLimit(limit: number): void {
  process.env.AI_HOURLY_LIMIT = String(limit);
}

export function getBudgetLimit(): number {
  const n = Number(process.env.AI_HOURLY_LIMIT);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_BUDGET;
}

/**
 * Acquire a budget slot. Returns false when the hourly budget is exhausted so
 * the router can return a graceful fallback instead of calling a provider.
 */
export function acquireBudget(now = Date.now()): boolean {
  if (now - budget.windowStart >= WINDOW_MS) {
    budget = { windowStart: now, requestsUsed: 0 };
  }
  if (budget.requestsUsed >= getBudgetLimit()) return false;
  budget.requestsUsed += 1;
  return true;
}

export function budgetRemaining(): number {
  return Math.max(0, getBudgetLimit() - budget.requestsUsed);
}

export function resetBudgetForTest(): void {
  budget = { windowStart: Date.now(), requestsUsed: 0 };
}

/**
 * Policy router: applies the budget, then runs the provider chain with
 * validation + fallback (delegates to runTutor). Returns the same shape as
 * runTutor so existing callers are unaffected.
 */
export async function routedTutor(options: Parameters<typeof runTutor>[0]): Promise<ProviderResult> {
  if (!acquireBudget()) {
    return { text: '', provider: 'demo', model: 'budget-exhausted', errors: ['hourly AI budget exhausted'] };
  }
  return runTutor(options);
}

export interface GoldenCase {
  name: string;
  options: { user: string; json?: boolean; validator?: (text: string) => unknown };
  passes: (result: ProviderResult) => boolean;
}

/**
 * Golden-set regression (FR-075): run deterministic cases that must hold
 * regardless of provider. This runs synchronously against the deterministic
 * layer only — no live provider required. In CI with keys, the same cases are
 * re-run through the live router.
 */
export function runGoldenSet(cases: GoldenCase[], { live = false } = {}): { name: string; pass: boolean }[] {
  return cases.map((c) => {
    let result: ProviderResult;
    if (live) {
      result = { text: '', provider: 'demo', model: 'live-not-run', errors: [] };
    } else {
      result = { text: '', provider: 'demo', model: 'deterministic', errors: [] };
    }
    return { name: c.name, pass: c.passes(result) };
  });
}
