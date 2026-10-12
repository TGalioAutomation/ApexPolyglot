import { migrate } from './dist/db/migrate.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
migrate(url)
  .then((applied) => {
    console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'No pending migrations');
  })
  .catch((error) => {
    console.error('Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
