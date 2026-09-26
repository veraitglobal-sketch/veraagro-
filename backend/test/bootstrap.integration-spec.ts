import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { readFileSync, mkdtempSync, cpSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import path = require('path');
import { tmpdir } from 'os';

const root = path.resolve(__dirname, '..');
const testUrl = process.env.BIOVERA_TEST_DATABASE_URL;
if (!testUrl || process.env.DATABASE_URL !== testUrl || process.env.NODE_ENV !== 'test' || new URL(testUrl).pathname !== '/biovera_test' || new URL(testUrl).hostname !== '127.0.0.1') {
  throw new Error('Use the isolated test runner');
}
const manifest = JSON.parse(readFileSync(path.join(root, 'prisma/bootstrap/manifest.json'), 'utf8'));

function command(args: string[], url = testUrl): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, DATABASE_URL: url }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, output }));
  });
}

describe('Safe empty-database initialization', () => {
  const prisma = new PrismaClient();
  afterAll(async () => { await prisma.$disconnect(); });

  it('records the exact historical migration checksums and finished states', async () => {
    const rows = await prisma.$queryRawUnsafe<any[]>('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name');
    const historical = new Set(manifest.migrations.map((row) => row.name));
    expect(rows.filter((row) => historical.has(row.migration_name)).map((row) => ({ name: row.migration_name, sha256: row.checksum }))).toEqual(manifest.migrations);
    expect(rows.some((row) => row.migration_name === '20260926120000_link_batch_harvest_plan')).toBe(true);
    expect(rows.every((row) => row.finished_at && !row.rolled_back_at)).toBe(true);
  });

  it('refuses to reinitialize existing data and leaves every history row untouched', async () => {
    await prisma.$executeRawUnsafe('CREATE TABLE bootstrap_sentinel (value TEXT)');
    await prisma.$executeRawUnsafe("INSERT INTO bootstrap_sentinel VALUES ('preserve-me')");
    try {
      const before = await prisma.$queryRawUnsafe('SELECT * FROM "_prisma_migrations" ORDER BY migration_name');
      const result = await command(['scripts/bootstrap-empty-db.cjs']);
      expect(result.code).toBe(1);
      expect(result.output).toContain('Refusing to bootstrap a non-empty schema');
      const retry = await command(['scripts/deploy-migrations.cjs']);
      expect(retry.code).toBe(0);
      expect(await prisma.$queryRawUnsafe('SELECT * FROM bootstrap_sentinel')).toEqual([{ value: 'preserve-me' }]);
      expect(await prisma.$queryRawUnsafe('SELECT * FROM "_prisma_migrations" ORDER BY migration_name')).toEqual(before);
    } finally {
      await prisma.$executeRawUnsafe('DROP TABLE bootstrap_sentinel');
    }
  });

  it('serializes concurrent initializations of an empty schema', async () => {
    await prisma.$executeRawUnsafe('CREATE SCHEMA bootstrap_concurrent');
    const url = new URL(testUrl);
    url.searchParams.set('schema', 'bootstrap_concurrent');
    try {
      const results = await Promise.all([1, 2].map(() => command(['scripts/bootstrap-empty-db.cjs', '--if-empty'], url.toString())));
      expect(results.map((r) => r.code)).toEqual([0, 0]);
      expect(results.filter((r) => r.output.includes('initialized from verified snapshot'))).toHaveLength(1);
      const [row] = await prisma.$queryRawUnsafe<any[]>('SELECT count(*)::int AS count FROM bootstrap_concurrent."_prisma_migrations"');
      expect(row.count).toBe(manifest.migrations.length);
    } finally {
      await prisma.$executeRawUnsafe('DROP SCHEMA bootstrap_concurrent CASCADE');
    }
  });

  it('still applies migrations added after the snapshot using Prisma', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'biovera-migration-fixture-'));
    const migrationName = '20990101000000_test_future_migration';
    cpSync(path.join(root, 'prisma'), directory, { recursive: true });
    mkdirSync(path.join(directory, 'migrations', migrationName));
    writeFileSync(path.join(directory, 'migrations', migrationName, 'migration.sql'), 'CREATE TABLE future_migration_probe (id INTEGER PRIMARY KEY);');
    try {
      const result = await command([require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema', path.join(directory, 'schema.prisma')]);
      expect(result.code).toBe(0);
      await prisma.$executeRawUnsafe('INSERT INTO future_migration_probe VALUES (1)');
      expect(await prisma.$queryRawUnsafe('SELECT id FROM future_migration_probe')).toEqual([{ id: 1 }]);
    } finally {
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS future_migration_probe');
      await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = ${migrationName}`;
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
