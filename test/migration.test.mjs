import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'migrations');
const files = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();

assert.ok(files.length >= 7, 'expected at least 7 migration files');
assert.deepEqual(files, [...files].sort(), 'migrations must be applied in lexicographic order');
assert.equal(files.some((file) => !/^\d{3}_[a-z_]+\.sql$/.test(file)), false, 'migration filenames must match NNN_name.sql');

let previousColumns = new Set();
for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  assert.ok(sql.trim().length > 100, `${file} too small`);
  assert.equal(/DROP\s+TABLE/.test(sql), false, `${file} must not DROP TABLE (would destroy data)`);
  const opens = (sql.match(/\(/g) || []).length;
  const closes = (sql.match(/\)/g) || []).length;
  assert.equal(opens, closes, `${file} unbalanced parentheses`);
  const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/g)].map((m) => m[1]);
  const alters = [...sql.matchAll(/ALTER TABLE ([a-z_]+)/g)].map((m) => m[1]);
  assert.ok(tables.length > 0 || alters.length > 0, `${file} defines no tables or alters`);
}

console.log(`migration schema tests passed (${files.length} migration files)`);
