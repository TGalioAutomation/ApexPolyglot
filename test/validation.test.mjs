import assert from 'node:assert/strict';
import { validateLanguageAllocation } from '../validation.mjs';

for (const valid of [{en:0,'zh-CN':100},{en:50,'zh-CN':50},{en:100,'zh-CN':0}]) {
  assert.equal(validateLanguageAllocation(valid), true, `expected valid: ${JSON.stringify(valid)}`);
}
for (const invalid of [
  {en:49,'zh-CN':50},
  {en:51,'zh-CN':50},
  {en:49.5,'zh-CN':50.5},
  {en:-1,'zh-CN':101},
  {en:50},
  {en:50,'zh-CN':50,other:0},
  null,
  []
]) {
  assert.equal(validateLanguageAllocation(invalid), false, `expected invalid: ${JSON.stringify(invalid)}`);
}

console.log('cross-field validation tests passed');
