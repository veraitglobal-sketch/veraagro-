-- CreateEnum
CREATE TYPE "SupplierMaterialBarcodeStatus" AS ENUM ('IN_STOCK', 'SOLD', 'VOID');

-- CreateTable
CREATE TABLE "supplier_material_barcodes" (
    "id" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "barcode" TEXT NOT NULL,
    "status" "SupplierMaterialBarcodeStatus" NOT NULL DEFAULT 'IN_STOCK',
    "lotNumber" TEXT,
    "note" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "soldToFarmerId" TEXT,
    "directOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_material_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_material_barcodes_barcode_key" ON "supplier_material_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "supplier_material_barcodes_supplierUserId_status_idx" ON "supplier_material_barcodes"("supplierUserId", "status");

-- CreateIndex
CREATE INDEX "supplier_material_barcodes_supplierUserId_createdAt_idx" ON "supplier_material_barcodes"("supplierUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "supplier_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_soldToFarmerId_fkey" FOREIGN KEY ("soldToFarmerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_directOrderId_fkey" FOREIGN KEY ("directOrderId") REFERENCES "supplier_direct_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
