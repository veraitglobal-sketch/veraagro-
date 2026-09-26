const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

const root = path.resolve(__dirname, '..');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

async function bootstrapEmptyDatabase({ ifEmpty = false } = {}) {
  // Match the existing CLI's .env behavior without starting the application.
  await require('@nestjs/config').ConfigModule.forRoot({ envFilePath: path.join(root, '.env') });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const manifest = JSON.parse(readFileSync(path.join(root, 'prisma/bootstrap/manifest.json'), 'utf8'));
  const snapshot = readFileSync(path.join(root, 'prisma/bootstrap', manifest.snapshot), 'utf8');
  if (sha256(snapshot) !== manifest.snapshotSha256) throw new Error('Bootstrap snapshot checksum mismatch');
  for (const migration of manifest.migrations) {
    const sql = readFileSync(path.join(root, 'prisma/migrations', migration.name, 'migration.sql'));
    if (sha256(sql) !== migration.sha256) throw new Error(`Historical migration checksum mismatch: ${migration.name}`);
  }
  const prisma = new PrismaClient();
  try {
    return await prisma.$transaction(async (tx) => {
      // Two new instances cannot initialize the same schema simultaneously.
      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtextextended(current_database() || ':' || current_schema(), 0))");
      const [{ occupied }] = await tx.$queryRawUnsafe(`SELECT (
        EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = current_schema()::regnamespace AND relkind IN ('r','p','v','m','S','f'))
        OR EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = current_schema()::regnamespace AND typtype IN ('e','d'))
        OR EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace = current_schema()::regnamespace)
      ) AS occupied`);
      if (occupied) {
        if (ifEmpty) return false;
        throw new Error('Refusing to bootstrap a non-empty schema. Existing data and migration history were not changed.');
      }
      // A single PostgreSQL DO statement accepts the full DDL snapshot inside
      // this transaction. No reset, TRUNCATE or rewriting existing history.
      await tx.$executeRawUnsafe(`DO $biovera_bootstrap$ BEGIN\n${snapshot}\nEND $biovera_bootstrap$;`);
      await tx.$executeRawUnsafe(`CREATE TABLE "_prisma_migrations" (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      )`);
      for (const migration of manifest.migrations) {
        await tx.$executeRaw`INSERT INTO "_prisma_migrations"
          (id, checksum, migration_name, finished_at, applied_steps_count)
          VALUES (${randomUUID()}, ${migration.sha256}, ${migration.name}, now(), 1)`;
      }
      return true;
    }, { timeout: 60000, maxWait: 60000 });
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { bootstrapEmptyDatabase };
if (require.main === module) {
  bootstrapEmptyDatabase({ ifEmpty: process.argv.includes('--if-empty') })
    .then((created) => console.log(created ? 'Empty database initialized from verified snapshot.' : 'Existing schema preserved; bootstrap skipped.'))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
