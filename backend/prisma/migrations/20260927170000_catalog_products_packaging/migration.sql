-- CreateEnum
CREATE TYPE "CatalogProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "catalog_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "estateId" TEXT,
    "sourcePlantingId" TEXT,
    "plannedQuantityKg" DOUBLE PRECISION NOT NULL,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "status" "CatalogProductStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_pack_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "packSizeKg" DOUBLE PRECISION NOT NULL,
    "pricePerPack" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_pack_options_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "catalogProductId" TEXT,
ADD COLUMN "packOptionId" TEXT,
ADD COLUMN "packLabel" TEXT,
ADD COLUMN "packSizeKg" DOUBLE PRECISION,
ADD COLUMN "packCount" INTEGER;

-- CreateIndex
CREATE INDEX "catalog_products_status_idx" ON "catalog_products"("status");

-- CreateIndex
CREATE INDEX "catalog_products_estateId_idx" ON "catalog_products"("estateId");

-- CreateIndex
CREATE INDEX "catalog_products_sourcePlantingId_idx" ON "catalog_products"("sourcePlantingId");

-- CreateIndex
CREATE INDEX "catalog_pack_options_productId_idx" ON "catalog_pack_options"("productId");

-- CreateIndex
CREATE INDEX "orders_catalogProductId_idx" ON "orders"("catalogProductId");

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_sourcePlantingId_fkey" FOREIGN KEY ("sourcePlantingId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_pack_options" ADD CONSTRAINT "catalog_pack_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_packOptionId_fkey" FOREIGN KEY ("packOptionId") REFERENCES "catalog_pack_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
