import { migrate } from './dist/db/migrate.js';
import { seedCurriculum } from './dist/curriculum/service.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
try {
  const applied = await migrate(url);
  if (applied.length) console.log(`Applied migrations: ${applied.join(', ')}`);
  const result = await seedCurriculum(url);
  console.log(`Curriculum seeded: course=${result.course} version=${result.version} units=${result.units} lessons=${result.lessons}`);
} catch (error) {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
