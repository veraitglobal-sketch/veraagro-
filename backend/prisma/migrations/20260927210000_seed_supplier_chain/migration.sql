-- AlterTable
ALTER TABLE "supplier_catalog_items" ADD COLUMN "approvedProductId" TEXT;

-- CreateIndex
CREATE INDEX "supplier_catalog_items_approvedProductId_idx" ON "supplier_catalog_items"("approvedProductId");

-- AddForeignKey
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_approvedProductId_fkey" FOREIGN KEY ("approvedProductId") REFERENCES "approved_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
