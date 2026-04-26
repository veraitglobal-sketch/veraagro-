-- One public code per parcel for store-facing QR (/plot/BIO-PLOT-…)
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "publicCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "parcels_publicCode_key" ON "parcels"("publicCode");
