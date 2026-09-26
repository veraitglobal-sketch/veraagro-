CREATE TABLE "refund_reconciliations" (
 "id" TEXT NOT NULL PRIMARY KEY, "refundId" TEXT NOT NULL, "amountCents" INTEGER NOT NULL,
 "currency" TEXT NOT NULL, "recoveredCents" INTEGER NOT NULL, "platformCostCents" INTEGER NOT NULL,
 "reason" TEXT NOT NULL, "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "requestHash" TEXT NOT NULL,
 CONSTRAINT "refund_reconciliation_totals" CHECK ("amountCents" > 0 AND "recoveredCents" >= 0 AND "platformCostCents" >= 0 AND "recoveredCents" + "platformCostCents" = "amountCents"),
 CONSTRAINT "refund_reconciliations_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "delivery_refunds"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "refund_reconciliations_refundId_key" ON "refund_reconciliations"("refundId");
CREATE TABLE "refund_reconciliation_entries" (
 "id" TEXT NOT NULL PRIMARY KEY, "reconciliationId" TEXT NOT NULL, "sourceKey" TEXT NOT NULL,
 "creditId" TEXT, "debitId" TEXT, "recipientUserId" TEXT, "amountCents" INTEGER NOT NULL, "method" TEXT NOT NULL,
 CONSTRAINT "refund_reconciliation_entry_amount" CHECK ("amountCents" > 0),
 CONSTRAINT "refund_reconciliation_entry_method" CHECK (("method" = 'WALLET_RECOVERY' AND "creditId" IS NOT NULL AND "debitId" IS NOT NULL) OR ("method" = 'PLATFORM_COST' AND "debitId" IS NULL)),
 CONSTRAINT "refund_reconciliation_entries_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "refund_reconciliations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "refund_reconciliation_entries_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "refund_reconciliation_entries_debitId_fkey" FOREIGN KEY ("debitId") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "refund_reconciliation_entries_creditId_key" ON "refund_reconciliation_entries"("creditId");
CREATE UNIQUE INDEX "refund_reconciliation_entries_debitId_key" ON "refund_reconciliation_entries"("debitId");
CREATE UNIQUE INDEX "refund_reconciliation_entries_reconciliationId_sourceKey_key" ON "refund_reconciliation_entries"("reconciliationId", "sourceKey");
CREATE INDEX "refund_reconciliation_entries_recipientUserId_idx" ON "refund_reconciliation_entries"("recipientUserId");
