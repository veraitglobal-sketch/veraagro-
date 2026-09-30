-- Seed Phase 3: field diary persistence + partial bag usage

ALTER TYPE "SeedStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_USED';

ALTER TABLE "seeds" ADD COLUMN IF NOT EXISTS "quantityRemaining" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "field_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "parcelId" TEXT,
    "plantingId" TEXT,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "materialName" TEXT,
    "materialQuantity" DOUBLE PRECISION,
    "materialUnit" TEXT,
    "areaHa" DOUBLE PRECISION,
    "seedSerialNumber" TEXT,
    "seedId" TEXT,
    "fertilizerBarcode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notes" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "data" JSONB NOT NULL,
    "clientReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "field_entries_userId_clientReference_key" ON "field_entries"("userId", "clientReference");

CREATE INDEX IF NOT EXISTS "field_entries_userId_occurredAt_idx" ON "field_entries"("userId", "occurredAt");
CREATE INDEX IF NOT EXISTS "field_entries_parcelId_idx" ON "field_entries"("parcelId");
CREATE INDEX IF NOT EXISTS "field_entries_seedId_idx" ON "field_entries"("seedId");
