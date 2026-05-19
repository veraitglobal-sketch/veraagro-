-- Field diary material traceability (barcode + kind on growth log)
ALTER TABLE "growth_logs" ADD COLUMN IF NOT EXISTS "materialBarcode" TEXT;
ALTER TABLE "growth_logs" ADD COLUMN IF NOT EXISTS "materialKind" TEXT;

CREATE INDEX IF NOT EXISTS "growth_logs_materialBarcode_idx" ON "growth_logs"("materialBarcode");
