import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

for (const id of ['knowledge','vocabularyPanel','grammarPanel','revealVocabulary','vocabularyActions','grammarChoices','grammarFeedback']) {
  assert.match(html, new RegExp(`id="${id}"`), `missing knowledge UI: ${id}`);
}
assert.match(html, /role="tablist"/);
assert.match(html, /role="tabpanel"/);
assert.match(html, /aria-live="polite"/);

assert.equal(new Set([...app.matchAll(/id:'en-v-[^']+'/g)].map((match) => match[0])).size, 6);
assert.equal(new Set([...app.matchAll(/id:'zh-v-[^']+'/g)].map((match) => match[0])).size, 6);
assert.equal(new Set([...app.matchAll(/id:'en-g-[^']+'/g)].map((match) => match[0])).size, 3);
assert.equal(new Set([...app.matchAll(/id:'zh-g-[^']+'/g)].map((match) => match[0])).size, 3);
assert.match(app, /lingopilot-knowledge-progress/);
assert.match(app, /reviewVocabulary/);
assert.match(app, /grammarPassed/);
assert.match(app, /playWithOpenVox\(event\.currentTarget\.dataset\.text/);

console.log('vocabulary and grammar feature tests passed');
