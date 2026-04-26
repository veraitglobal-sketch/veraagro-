-- Repair script if `20260505130000_missions_harvest_announcement` failed partway
-- or you need to align DB with Prisma before: migrate resolve --applied
--
-- 1) Run in Railway/Postgres SQL console (or psql) against the SAME database as .env
-- 2) Then: npx prisma migrate resolve --applied 20260505130000_missions_harvest_announcement
-- 3) Then: npx prisma migrate deploy
--
-- Idempotent: safe to re-run on a half-applied or clean DB (PG 9.1+ for IF NOT EXISTS on columns)

-- FK must be dropped before recreating the unique index if you need to fix a bad index name/state.
ALTER TABLE "missions" DROP CONSTRAINT IF EXISTS "missions_harvestAnnouncementId_fkey";

ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "harvestAnnouncementId" TEXT;

DROP INDEX IF EXISTS "missions_harvestAnnouncementId_key";
DROP INDEX IF EXISTS "missions_harvestAnnouncementId_idx";

CREATE UNIQUE INDEX "missions_harvestAnnouncementId_key" ON "missions"("harvestAnnouncementId");
CREATE INDEX "missions_harvestAnnouncementId_idx" ON "missions"("harvestAnnouncementId");

ALTER TABLE "missions" ADD CONSTRAINT "missions_harvestAnnouncementId_fkey" FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
