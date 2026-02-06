-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "barcode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_quota_usage" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "orderId" TEXT,
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "maxQuotaPerHectare" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "estateArea" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_quota_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraped_prices" (
    "id" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "location" TEXT NOT NULL,
    "url" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraped_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_alerts_userId_idx" ON "security_alerts"("userId");

-- CreateIndex
CREATE INDEX "security_alerts_estateId_idx" ON "security_alerts"("estateId");

-- CreateIndex
CREATE INDEX "security_alerts_type_idx" ON "security_alerts"("type");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts"("severity");

-- CreateIndex
CREATE INDEX "security_alerts_status_idx" ON "security_alerts"("status");

-- CreateIndex
CREATE INDEX "security_alerts_createdAt_idx" ON "security_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "discount_quota_usage_farmerId_idx" ON "discount_quota_usage"("farmerId");

-- CreateIndex
CREATE INDEX "discount_quota_usage_orderId_idx" ON "discount_quota_usage"("orderId");

-- CreateIndex
CREATE INDEX "discount_quota_usage_createdAt_idx" ON "discount_quota_usage"("createdAt");

-- CreateIndex
CREATE INDEX "scraped_prices_retailer_idx" ON "scraped_prices"("retailer");

-- CreateIndex
CREATE INDEX "scraped_prices_cropType_idx" ON "scraped_prices"("cropType");

-- CreateIndex
CREATE INDEX "scraped_prices_location_idx" ON "scraped_prices"("location");

-- CreateIndex
CREATE INDEX "scraped_prices_scrapedAt_idx" ON "scraped_prices"("scrapedAt");

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_quota_usage" ADD CONSTRAINT "discount_quota_usage_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_quota_usage" ADD CONSTRAINT "discount_quota_usage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
