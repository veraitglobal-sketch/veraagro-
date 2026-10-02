-- Link catalogue orders to the grower-selected lot used for packing and transport.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packedBatchId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "buyerPackedNotifiedAt" TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_packedBatchId_fkey'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_packedBatchId_fkey"
      FOREIGN KEY ("packedBatchId") REFERENCES "batches"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "orders_packedBatchId_idx" ON "orders"("packedBatchId");
