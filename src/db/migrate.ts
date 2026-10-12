import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const migrationsDir = fileURLToPath(new URL('../../migrations', import.meta.url));

function listMigrations(): string[] {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

export async function migrate(databaseUrl: string): Promise<string[]> {
  const pool = new Pool({ connectionString: databaseUrl });
  const applied: string[] = [];
  try {
    const client = await pool.connect();
    try {
      await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
      const { rows } = await client.query<{ version: string }>('SELECT version FROM schema_migrations');
      const alreadyApplied = new Set(rows.map((row) => row.version));
      for (const file of listMigrations()) {
        const version = basename(file, '.sql');
        if (alreadyApplied.has(version)) continue;
        const sql = readFileSync(join(migrationsDir, file), 'utf8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
        applied.push(version);
      }
      return applied;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}
