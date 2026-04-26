-- Line seller = Vera platform; physical farm = fulfillingEstateId (set by operativa)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillingEstateId" TEXT;

CREATE INDEX IF NOT EXISTS "orders_fulfillingEstateId_idx" ON "orders"("fulfillingEstateId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_fulfillingEstateId_fkey'
  ) THEN
    ALTER TABLE "orders"
    ADD CONSTRAINT "orders_fulfillingEstateId_fkey"
    FOREIGN KEY ("fulfillingEstateId") REFERENCES "estates"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
