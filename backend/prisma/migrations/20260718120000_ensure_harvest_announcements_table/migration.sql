-- Idempotent: production DBs that skipped squash or lost harvest_announcements must match Prisma schema.
-- Safe to re-run. FKs to parcels/users only when parent tables exist.

CREATE TABLE IF NOT EXISTS "harvest_announcements" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "estimatedDate" TIMESTAMP(3) NOT NULL,
    "estimatedQuantity" DOUBLE PRECISION,
    "plannedLoadingStart" TIMESTAMP(3),
    "plannedLoadingEnd" TIMESTAMP(3),
    "loadQuantityKg" DOUBLE PRECISION,
    "marketChannel" TEXT,
    "qualityGrade" TEXT,
    "sortingSpec" TEXT,
    "adminNotes" TEXT,
    "actualDate" TIMESTAMP(3),
    "actualQuantity" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "harvest_announcements_parcelId_idx" ON "harvest_announcements"("parcelId");
CREATE INDEX IF NOT EXISTS "harvest_announcements_userId_idx" ON "harvest_announcements"("userId");
CREATE INDEX IF NOT EXISTS "harvest_announcements_estimatedDate_idx" ON "harvest_announcements"("estimatedDate");
CREATE INDEX IF NOT EXISTS "harvest_announcements_status_idx" ON "harvest_announcements"("status");
CREATE INDEX IF NOT EXISTS "harvest_announcements_marketChannel_idx" ON "harvest_announcements"("marketChannel");

DO $$
BEGIN
  IF to_regclass('public.parcels') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'harvest_announcements_parcelId_fkey'
  ) THEN
    ALTER TABLE "harvest_announcements"
      ADD CONSTRAINT "harvest_announcements_parcelId_fkey"
      FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'harvest_announcements_userId_fkey'
  ) THEN
    ALTER TABLE "harvest_announcements"
      ADD CONSTRAINT "harvest_announcements_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- missions.harvestAnnouncementId (20260505130000) — column + FK when table now exists
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "harvestAnnouncementId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "missions_harvestAnnouncementId_key" ON "missions"("harvestAnnouncementId");
CREATE INDEX IF NOT EXISTS "missions_harvestAnnouncementId_idx" ON "missions"("harvestAnnouncementId");

DO $$
BEGIN
  IF to_regclass('public.harvest_announcements') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_harvestAnnouncementId_fkey'
  ) THEN
    BEGIN
      ALTER TABLE "missions"
        ADD CONSTRAINT "missions_harvestAnnouncementId_fkey"
        FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
