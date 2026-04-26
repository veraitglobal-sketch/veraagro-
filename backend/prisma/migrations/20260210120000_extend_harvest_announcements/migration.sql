-- AlterTable: logistics / channel fields for harvest plans (grower -> admin)
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "plannedLoadingStart" TIMESTAMP(3);
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "plannedLoadingEnd" TIMESTAMP(3);
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "loadQuantityKg" DOUBLE PRECISION;
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "marketChannel" TEXT;
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "qualityGrade" TEXT;
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "sortingSpec" TEXT;
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;

CREATE INDEX IF NOT EXISTS "harvest_announcements_marketChannel_idx" ON "harvest_announcements"("marketChannel");
