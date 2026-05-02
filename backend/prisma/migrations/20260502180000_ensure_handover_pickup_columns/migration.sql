-- Idempotent: some environments skipped 20260203120000 or diverged; ensure columns Prisma expects exist.
-- Uses quoted camelCase names matching schema.prisma / Prisma migrations.

ALTER TABLE "logistics_handovers" ADD COLUMN IF NOT EXISTS "pickupDriverId" TEXT;
ALTER TABLE "logistics_handovers" ADD COLUMN IF NOT EXISTS "pickupDriverSnapshot" JSONB;
ALTER TABLE "logistics_handovers" ADD COLUMN IF NOT EXISTS "pickupBadgePhotoUrl" TEXT;
ALTER TABLE "logistics_handovers" ADD COLUMN IF NOT EXISTS "pickupDriverSignatureUrl" TEXT;

ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "assignedLogisticsDriverId" TEXT;

CREATE INDEX IF NOT EXISTS "logistics_handovers_pickupDriverId_idx" ON "logistics_handovers"("pickupDriverId");
CREATE INDEX IF NOT EXISTS "missions_assignedLogisticsDriverId_idx" ON "missions"("assignedLogisticsDriverId");

-- FKs: ignore if already present (duplicate_object); skip if logistics_drivers not yet created
DO $$
BEGIN
  IF to_regclass('public.logistics_drivers') IS NOT NULL THEN
    BEGIN
      ALTER TABLE "logistics_handovers"
        ADD CONSTRAINT "logistics_handovers_pickupDriverId_fkey"
        FOREIGN KEY ("pickupDriverId") REFERENCES "logistics_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE "missions"
        ADD CONSTRAINT "missions_assignedLogisticsDriverId_fkey"
        FOREIGN KEY ("assignedLogisticsDriverId") REFERENCES "logistics_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
