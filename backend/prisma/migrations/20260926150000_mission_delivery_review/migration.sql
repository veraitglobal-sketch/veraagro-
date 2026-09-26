ALTER TABLE "deliveries" ADD COLUMN "missionId" TEXT;
CREATE UNIQUE INDEX "deliveries_missionId_key" ON "deliveries"("missionId");
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "buyer_delivery_issues"
 ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
 ADD COLUMN "resolution" TEXT,
 ADD COLUMN "outcome" TEXT,
 ADD COLUMN "resolvedBy" TEXT,
 ADD COLUMN "resolvedAt" TIMESTAMP(3),
 ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "disputes" ADD COLUMN "outcome" TEXT, ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "digital_handovers" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
