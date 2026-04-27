-- Link transport missions to buyer sales orders (operativa creates prep runs from admin)
ALTER TABLE "missions" ADD COLUMN "orderId" TEXT;
CREATE INDEX "missions_orderId_idx" ON "missions"("orderId");
ALTER TABLE "missions" ADD CONSTRAINT "missions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
