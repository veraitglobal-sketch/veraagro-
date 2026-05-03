-- When the buyer confirms physical takeover after warehouse/store digital handover.
-- Used for the 24h complaint window (buyer_delivery_issues), separate from `deliveredAt` (dock receipt).
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "buyerPickupConfirmedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "deliveries_buyerPickupConfirmedAt_idx" ON "deliveries"("buyerPickupConfirmedAt");
