-- Grower can confirm B2B material order receipt at farm (separate from supplier status).
ALTER TABLE "supplier_direct_orders" ADD COLUMN "farmerReceivedAt" TIMESTAMP(3);
