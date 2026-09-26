CREATE TABLE "delivery_returns" (
 "id" TEXT NOT NULL PRIMARY KEY, "deliveryId" TEXT NOT NULL, "issueId" TEXT, "disputeId" TEXT,
 "status" TEXT NOT NULL DEFAULT 'PLANNED', "carrierUserId" TEXT NOT NULL, "receiverUserId" TEXT NOT NULL,
 "destinationAddress" TEXT NOT NULL, "instructions" TEXT NOT NULL, "createdBy" TEXT NOT NULL,
 "collectedBy" TEXT, "receivedBy" TEXT, "collectedAt" TIMESTAMP(3), "receivedAt" TIMESTAMP(3),
 "collectionPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[], "receiptPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
 "collectionNotes" TEXT, "receiptNotes" TEXT, "revision" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "delivery_returns_one_source" CHECK (("issueId" IS NULL) <> ("disputeId" IS NULL)),
 CONSTRAINT "delivery_returns_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "delivery_returns_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "buyer_delivery_issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "delivery_returns_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "delivery_returns_deliveryId_key" ON "delivery_returns"("deliveryId");
CREATE UNIQUE INDEX "delivery_returns_issueId_key" ON "delivery_returns"("issueId");
CREATE UNIQUE INDEX "delivery_returns_disputeId_key" ON "delivery_returns"("disputeId");
CREATE INDEX "delivery_returns_carrierUserId_status_idx" ON "delivery_returns"("carrierUserId", "status");
CREATE INDEX "delivery_returns_receiverUserId_status_idx" ON "delivery_returns"("receiverUserId", "status");
CREATE TABLE "delivery_refunds" (
 "id" TEXT NOT NULL PRIMARY KEY, "deliveryId" TEXT NOT NULL, "paymentId" TEXT NOT NULL, "returnId" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'APPROVED', "amountCents" INTEGER NOT NULL, "currency" TEXT NOT NULL,
 "originalPaymentStatus" TEXT NOT NULL, "reconciliationRequired" BOOLEAN NOT NULL DEFAULT false,
 "approvedBy" TEXT NOT NULL, "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "confirmedBy" TEXT, "confirmedAt" TIMESTAMP(3), "bankReference" TEXT, "bankPaidAt" TIMESTAMP(3), "bankEvidence" TEXT,
 "reason" TEXT NOT NULL, "revision" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "delivery_refunds_amount_positive" CHECK ("amountCents" > 0),
 CONSTRAINT "delivery_refunds_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "delivery_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "delivery_refunds_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "delivery_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "delivery_refunds_deliveryId_key" ON "delivery_refunds"("deliveryId");
CREATE UNIQUE INDEX "delivery_refunds_paymentId_key" ON "delivery_refunds"("paymentId");
CREATE UNIQUE INDEX "delivery_refunds_returnId_key" ON "delivery_refunds"("returnId");
CREATE UNIQUE INDEX "delivery_refunds_bankReference_key" ON "delivery_refunds"("bankReference");
CREATE INDEX "delivery_refunds_status_idx" ON "delivery_refunds"("status");
