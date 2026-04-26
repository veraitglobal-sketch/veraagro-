-- Optional score from grower app quick quality entry
ALTER TABLE "quality_entries" ADD COLUMN IF NOT EXISTS "qualityScore" DOUBLE PRECISION;
