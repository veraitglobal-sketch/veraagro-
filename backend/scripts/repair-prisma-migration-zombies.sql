-- Remove duplicate failed/rolled-back rows in _prisma_migrations when a successful
-- row for the same migration_name already exists. Safe on Railway prod when columns
-- are present but P3009 / "migration failed" ghosts remain.
--
-- After: npx ts-node scripts/verify-db-schema-for-mobile.ts
--        npx prisma migrate deploy

DELETE FROM "_prisma_migrations" AS z
WHERE (z.finished_at IS NULL OR z.rolled_back_at IS NOT NULL)
  AND EXISTS (
    SELECT 1
    FROM "_prisma_migrations" AS ok
    WHERE ok.migration_name = z.migration_name
      AND ok.finished_at IS NOT NULL
      AND ok.rolled_back_at IS NULL
      AND ok.started_at <> z.started_at
  );
