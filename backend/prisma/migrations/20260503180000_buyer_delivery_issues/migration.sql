-- Buyer delivery issue reports (photos + description, 24h from recorded receipt only)
CREATE TABLE "buyer_delivery_issues" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrls" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_delivery_issues_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "buyer_delivery_issues_deliveryId_idx" ON "buyer_delivery_issues"("deliveryId");
CREATE INDEX "buyer_delivery_issues_buyerId_idx" ON "buyer_delivery_issues"("buyerId");
CREATE INDEX "buyer_delivery_issues_createdAt_idx" ON "buyer_delivery_issues"("createdAt");

ALTER TABLE "buyer_delivery_issues" ADD CONSTRAINT "buyer_delivery_issues_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_delivery_issues" ADD CONSTRAINT "buyer_delivery_issues_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
