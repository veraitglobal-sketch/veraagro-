-- Link grower growth journal rows to a harvest/planting plan (optional FK when table exists)
-- Some environments may not have harvest_announcements yet; column + index always apply, FK is best-effort.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'growth_logs' AND column_name = 'harvestAnnouncementId'
  ) THEN
    ALTER TABLE "growth_logs" ADD COLUMN "harvestAnnouncementId" TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "growth_logs_harvestAnnouncementId_idx" ON "growth_logs"("harvestAnnouncementId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'harvest_announcements'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'growth_logs_harvestAnnouncementId_fkey'
  ) THEN
    ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_harvestAnnouncementId_fkey"
    FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
