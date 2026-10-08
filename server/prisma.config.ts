import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 keeps the connection URL out of the schema file. Migrate and seed
 * read it from here, while the runtime client receives it through the pg driver
 * adapter in `src/database`.
 *
 * Prisma 7 does not load `.env` for a project that has a config file, so the
 * file is loaded explicitly here. Node 20.12+ provides `process.loadEnvFile`;
 * a missing `.env` is not an error, because CI supplies real environment
 * variables instead.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // No local .env — rely on the ambient environment.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // Prisma 7 configures the seed command here rather than in package.json.
    seed: 'tsx prisma/seed.ts',
  },
});
