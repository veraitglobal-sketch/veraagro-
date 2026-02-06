-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVeraPartner" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "bio_white_list" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bio_white_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_logs" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "parcelId" TEXT,
    "entryType" TEXT NOT NULL,
    "scannedBarcode" TEXT NOT NULL,
    "barcodeType" TEXT NOT NULL,
    "isCompliant" BOOLEAN NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "blockedReason" TEXT,
    "gpsLatitude" DOUBLE PRECISION NOT NULL,
    "gpsLongitude" DOUBLE PRECISION NOT NULL,
    "gpsAccuracy" DOUBLE PRECISION,
    "isWithinFarm" BOOLEAN NOT NULL,
    "photos" TEXT[],
    "deviceFingerprint" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceTimestamp" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "offlineId" TEXT,
    "relatedSeedInventoryId" TEXT,
    "relatedBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "networkTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bio_white_list_barcode_key" ON "bio_white_list"("barcode");

-- CreateIndex
CREATE INDEX "bio_white_list_barcode_idx" ON "bio_white_list"("barcode");

-- CreateIndex
CREATE INDEX "bio_white_list_isActive_idx" ON "bio_white_list"("isActive");

-- CreateIndex
CREATE INDEX "compliance_logs_farmerId_idx" ON "compliance_logs"("farmerId");

-- CreateIndex
CREATE INDEX "compliance_logs_estateId_idx" ON "compliance_logs"("estateId");

-- CreateIndex
CREATE INDEX "compliance_logs_parcelId_idx" ON "compliance_logs"("parcelId");

-- CreateIndex
CREATE INDEX "compliance_logs_scannedBarcode_idx" ON "compliance_logs"("scannedBarcode");

-- CreateIndex
CREATE INDEX "compliance_logs_isCompliant_idx" ON "compliance_logs"("isCompliant");

-- CreateIndex
CREATE INDEX "compliance_logs_synced_idx" ON "compliance_logs"("synced");

-- CreateIndex
CREATE INDEX "compliance_logs_createdAt_idx" ON "compliance_logs"("createdAt");

-- CreateIndex
CREATE INDEX "compliance_logs_entryType_idx" ON "compliance_logs"("entryType");

-- CreateIndex
CREATE INDEX "compliance_logs_complianceStatus_idx" ON "compliance_logs"("complianceStatus");

-- CreateIndex
CREATE INDEX "hubs_status_city_idx" ON "hubs"("status", "city");

-- AddForeignKey
ALTER TABLE "compliance_logs" ADD CONSTRAINT "compliance_logs_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_logs" ADD CONSTRAINT "compliance_logs_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_logs" ADD CONSTRAINT "compliance_logs_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
