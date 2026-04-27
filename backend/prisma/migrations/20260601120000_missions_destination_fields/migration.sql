-- Destinations and loading notes for transport missions (utovar / dispatch clarity)
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "destinationAddress" TEXT;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "destinationCity" TEXT;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "loadInstructions" TEXT;

CREATE INDEX IF NOT EXISTS "missions_destinationCity_idx" ON "missions"("destinationCity");
