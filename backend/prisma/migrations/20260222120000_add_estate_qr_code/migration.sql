-- AlterTable
ALTER TABLE "estates" ADD COLUMN IF NOT EXISTS "estateQrCode" TEXT;

-- Backfill: give existing estates a unique QR code (first 8 chars of id without dashes)
UPDATE "estates"
SET "estateQrCode" = 'ESTATE-' || UPPER(SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 8))
WHERE "estateQrCode" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "estates_estateQrCode_key" ON "estates"("estateQrCode");
