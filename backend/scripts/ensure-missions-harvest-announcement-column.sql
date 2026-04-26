-- ---------------------------------------------------------------------------
-- Repair: missions.harvestAnnouncementId
-- Use when: Prisma reports migration 20260505130000 as applied but the column
--           is missing (P2022), e.g. partial apply or wrong DB copy.
-- Run: Railway Database → Data → Query, or:
--   psql "$DATABASE_URL" -f backend/scripts/ensure-missions-harvest-announcement-column.sql
-- ---------------------------------------------------------------------------

-- Optional: confirm referenced table exists (should return 1 row)
-- SELECT 1 FROM information_schema.tables
--  WHERE table_schema = 'public' AND table_name = 'harvest_announcements';

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS "harvestAnnouncementId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "missions_harvestAnnouncementId_key"
  ON public.missions ("harvestAnnouncementId");

CREATE INDEX IF NOT EXISTS "missions_harvestAnnouncementId_idx"
  ON public.missions ("harvestAnnouncementId");

ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS "missions_harvestAnnouncementId_fkey";

-- Fails if public.harvest_announcements does not exist — create schema via migrations first.
ALTER TABLE public.missions
  ADD CONSTRAINT "missions_harvestAnnouncementId_fkey"
  FOREIGN KEY ("harvestAnnouncementId")
  REFERENCES public.harvest_announcements ("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Verify (expect 1 row: harvestAnnouncementId | text)
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name = 'missions'
--    AND column_name = 'harvestAnnouncementId';
