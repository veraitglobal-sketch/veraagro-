-- Buyer-scoped checkout attempts survive lost responses; legacy orders keep null keys.
ALTER TABLE "orders" ADD COLUMN "clientRequestId" TEXT, ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "orders_buyerId_clientRequestId_key" ON "orders"("buyerId", "clientRequestId");
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_request_pair" CHECK (("clientRequestId" IS NULL) = ("requestHash" IS NULL));
