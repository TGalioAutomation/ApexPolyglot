// LingoVoice — Migration runner PostgreSQL
// Chạy: node db/migrate.mjs  (cần DATABASE_URL) hoặc import { runMigrations }
// Ghi nhận file đã áp dụng trong bảng schema_migrations; mỗi file chạy trong 1 transaction.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function runMigrations(connectionString, logger = console) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.log(`[migrate] đã áp dụng ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} thất bại: ${error.message}`);
      }
    }
    return files.filter((f) => !applied.has(f));
  } finally {
    await client.end();
  }
}

// Chạy trực tiếp: node db/migrate.mjs
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv[1].endsWith('migrate.mjs')) {
  const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!url) {
    console.error('Thiếu DATABASE_URL (hoặc TEST_DATABASE_URL). Ví dụ: postgres://lingovoice:secret@localhost:5432/lingovoice');
    process.exit(1);
  }
  runMigrations(url)
    .then(() => { console.log('[migrate] hoàn tất'); process.exit(0); })
    .catch((error) => { console.error('[migrate] lỗi:', error.message); process.exit(1); });
}
