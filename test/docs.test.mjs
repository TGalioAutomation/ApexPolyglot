import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'docs/README.md',
  'docs/design-goal.md',
  'docs/full-product-design.md',
  'docs/product-requirements.md',
  'docs/ux-design-system.md',
  'docs/learning-ai-spec.md',
  'docs/curriculum-catalog.md',
  'docs/technical-architecture.md',
  'docs/openapi.yaml',
  'docs/production-operations.md',
  'docs/delivery-governance.md',
  'docs/traceability-matrix.md'
];

for (const path of required) {
  assert.equal(existsSync(join(root, path)), true, `missing required document: ${path}`);
  assert.ok(readFileSync(join(root, path), 'utf8').trim().length > 500, `document is too small: ${path}`);
}

const markdownFiles = ['README.md', ...required.filter((path) => path.endsWith('.md'))];
for (const path of markdownFiles) {
  const content = readFileSync(join(root, path), 'utf8');
  let inFence = false;
  content.split(/\r?\n/).forEach((line, index) => {
    if (!line.startsWith('```')) return;
    if (!inFence) assert.ok(line.trim().length > 3, `code fence lacks language in ${path}:${index + 1}`);
    inFence = !inFence;
  });
  assert.equal(inFence, false, `unclosed code fence in ${path}`);
  const links = [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const target of links) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const localPath = decodeURIComponent(target.split('#')[0]);
    if (!localPath) continue;
    assert.equal(existsSync(resolve(dirname(join(root, path)), localPath)), true, `broken local link in ${path}: ${target}`);
  }
}

const prd = readFileSync(join(root, 'docs/product-requirements.md'), 'utf8');
for (const [prefix, expectedCount] of [['FR-', 180], ['BR-', 40], ['NFR-', 22], ['AC-', 18]]) {
  const ids = [...prd.matchAll(new RegExp(`\\b${prefix}(\\d{3})\\b`, 'g'))].map((match) => `${prefix}${match[1]}`);
  const unique = [...new Set(ids)];
  assert.equal(unique.length, expectedCount, `${prefix} IDs must be unique and complete`);
  assert.deepEqual(unique.map((id) => Number(id.slice(prefix.length))).sort((a, b) => a - b), Array.from({length: expectedCount}, (_, index) => index + 1), `${prefix} sequence has gaps`);
}

const traceability = readFileSync(join(root, 'docs/traceability-matrix.md'), 'utf8');
for (const area of ['Product', 'UX', 'Learning', 'AI', 'Architecture', 'Security', 'Operations', 'QA']) assert.match(traceability, new RegExp(area, 'i'), `traceability lacks ${area}`);
for (const range of ['FR-001–FR-014', 'FR-171–FR-180', 'BR-001–BR-011', 'NFR-001–NFR-004', 'AC-015–AC-018']) assert.ok(traceability.includes(range), `traceability lacks direct mapping ${range}`);

const curriculum = readFileSync(join(root, 'docs/curriculum-catalog.md'), 'utf8');
for (const languagePattern of ['EN', 'ZH-CN']) {
  const units = new Set([...curriculum.matchAll(new RegExp(`\\b${languagePattern}-L\\d{2}-D\\d{3}-U01\\b`, 'g'))].map((match) => match[0]));
  const lessons = new Set([...curriculum.matchAll(new RegExp(`\\b${languagePattern}-L\\d{2}-D\\d{3}-U01-(?:LIS|REA|SPE|REV)01\\b`, 'g'))].map((match) => match[0]));
  assert.equal(units.size, 90, `${languagePattern} curriculum must contain 90 stable units`);
  assert.equal(lessons.size, 360, `${languagePattern} curriculum must contain four canonical lessons per unit`);
}

const openapi = readFileSync(join(root, 'docs/openapi.yaml'), 'utf8');
assert.match(openapi, /^openapi: 3\.1\.0/m);
for (const route of ['/auth/register:', '/auth/session:', '/today:', '/assessment-runs:', '/tutor/conversations:', '/voice/synthesis:', '/reviews/due:', '/notifications:', '/admin/content/items:', '/reports:', '/support/tickets:', '/billing/subscription:', '/entitlements:', '/analytics/events:', '/me:']) assert.ok(openapi.includes(route), `OpenAPI lacks ${route}`);
for (const contract of ['CsrfToken:', 'standardError:', 'recommendedStartUnit:', '"zh-CN":', 'RateLimited:']) assert.ok(openapi.includes(contract), `OpenAPI lacks contract ${contract}`);
assert.ok(openapi.includes('x-validation-rule-id: allocation-sum-100-v1'), 'OpenAPI lacks enforceable language allocation rule ID');
const architecture = readFileSync(join(root, 'docs/technical-architecture.md'), 'utf8');
assert.match(architecture, /allocation-sum-100-v1[\s\S]*reject `99`, `101`/, 'architecture lacks allocation cross-field contract test oracle');
for (const role of ['learner', 'content_editor', 'learning_reviewer', 'support', 'moderator', 'billing_admin', 'auditor', 'admin']) assert.match(openapi, new RegExp(`\\b${role}\\b`), `OpenAPI lacks canonical role ${role}`);

console.log(`documentation checks passed (${required.length} required artifacts)`);
