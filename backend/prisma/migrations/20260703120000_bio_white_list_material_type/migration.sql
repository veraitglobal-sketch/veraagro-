-- Classify whitelist materials (seed, spray/crop protection, fertilizer, other)
ALTER TABLE "bio_white_list" ADD COLUMN "materialType" TEXT NOT NULL DEFAULT 'OTHER';
CREATE INDEX "bio_white_list_materialType_idx" ON "bio_white_list"("materialType");
