/**
 * Ground-truth check: does THIS database (DATABASE_URL from backend/.env) have
 * columns/tables the grower mobile app needs? Prisma "migrate status" can say
 * "up to date" while columns are missing if someone used migrate resolve --applied
 * without running SQL (see backend/MIGRATIONS.md).
 *
 * Usage: cd backend && npx ts-node scripts/verify-db-schema-for-mobile.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Row = { ok: boolean; label: string; detail: string };

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

/** Failed rows with no successful twin for the same migration_name (real P3009). */
async function failedMigrations(): Promise<{ name: string; started: Date }[]> {
  try {
    return await prisma.$queryRaw<{ name: string; started: Date }[]>`
      SELECT z.migration_name AS name, z.started_at AS started
      FROM "_prisma_migrations" z
      WHERE (z.finished_at IS NULL OR z.rolled_back_at IS NOT NULL)
        AND NOT EXISTS (
          SELECT 1 FROM "_prisma_migrations" ok
          WHERE ok.migration_name = z.migration_name
            AND ok.finished_at IS NOT NULL
            AND ok.rolled_back_at IS NULL
        )
      ORDER BY z.started_at DESC
      LIMIT 10
    `;
  } catch {
    return [];
  }
}

async function lastApplied(): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<{ name: string }[]>`
      SELECT migration_name AS name FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY finished_at DESC
      LIMIT 5
    `;
    return rows.map((r) => r.name);
  } catch {
    return [];
  }
}

async function main() {
  const url = process.env.DATABASE_URL ?? '(not set)';
  const host = url.replace(/:[^:@]+@/, ':****@').slice(0, 120);

  console.log('\n=== Bio Vera DB check (mobile-critical schema) ===');
  console.log(`DATABASE_URL host: ${host}\n`);

  const checks: Row[] = [];

  const growthHarvest = await columnExists('growth_logs', 'harvestAnnouncementId');
  checks.push({
    ok: growthHarvest,
    label: 'growth_logs.harvestAnnouncementId',
    detail: growthHarvest ? 'present' : 'MISSING — field log sync will fail (migration 20260427140000_growth_log_harvest_announcement)',
  });

  const parcelApproved = await columnExists('parcels', 'approvedAt');
  checks.push({
    ok: parcelApproved,
    label: 'parcels.approvedAt',
    detail: parcelApproved ? 'present' : 'MISSING — no approved parcels in mobile picker',
  });

  const ingest = await tableExists('grower_mobile_ingest');
  checks.push({
    ok: ingest,
    label: 'table grower_mobile_ingest',
    detail: ingest ? 'present' : 'MISSING — migration 20260505120000_grower_mobile_ingest',
  });

  const failed = await failedMigrations();
  checks.push({
    ok: failed.length === 0,
    label: '_prisma_migrations (no failed rows)',
    detail:
      failed.length === 0
        ? 'ok'
        : `FAILED/PENDING: ${failed.map((f) => f.name).join(', ')} — run: npx prisma migrate deploy`,
  });

  for (const c of checks) {
    console.log(`${c.ok ? 'OK' : 'FAIL'}  ${c.label}`);
    console.log(`      ${c.detail}`);
  }

  const recent = await lastApplied();
  if (recent.length) {
    console.log('\nLast applied migrations:');
    for (const n of recent) console.log(`  - ${n}`);
  }

  const allOk = checks.every((c) => c.ok);
  console.log(
    allOk
      ? '\nResult: schema looks OK for mobile on THIS database.\n'
      : '\nResult: schema is OUT OF DATE on THIS database. Fix:\n  cd backend\n  npx prisma migrate deploy\n  (use the SAME DATABASE_URL as the running API / api.biovera.app)\n',
  );

  process.exit(allOk ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
