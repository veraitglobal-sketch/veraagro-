-- Idempotent: Railway / legacy DBs may have bio_white_list without columns from squash baseline.
-- Prisma expects: phiDays, mrlLimit, materialType (see schema.prisma).

ALTER TABLE "bio_white_list" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "bio_white_list" ADD COLUMN IF NOT EXISTS "phiDays" INTEGER;
ALTER TABLE "bio_white_list" ADD COLUMN IF NOT EXISTS "mrlLimit" DOUBLE PRECISION;
ALTER TABLE "bio_white_list" ADD COLUMN IF NOT EXISTS "materialType" TEXT NOT NULL DEFAULT 'OTHER';

CREATE INDEX IF NOT EXISTS "bio_white_list_materialType_idx" ON "bio_white_list"("materialType");
