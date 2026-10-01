-- Order-level packing (grower prepares catalogue orders)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packedPackCount" INTEGER;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packedKg" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packedAt" TIMESTAMP(3);

-- Planting kind enum stored as text (EXISTING_ORCHARD, NEW_PLANTING)
ALTER TABLE "harvest_announcements" ADD COLUMN IF NOT EXISTS "plantingKind" TEXT;

-- Backfill Serbian "(Postojeći zasad)" suffix embedded in cropType
UPDATE "harvest_announcements"
SET
  "plantingKind" = 'EXISTING_ORCHARD',
  "cropType" = TRIM(REGEXP_REPLACE("cropType", '\s*\(Postojeći zasad\)\s*$', '', 'i'))
WHERE "announcementType" = 'PLANTING'
  AND "cropType" ~* '\(Postojeći zasad\)'
  AND ("plantingKind" IS NULL OR "plantingKind" = '');

UPDATE "harvest_announcements"
SET "plantingKind" = 'NEW_PLANTING'
WHERE "announcementType" = 'PLANTING'
  AND "plantingKind" IS NULL;
