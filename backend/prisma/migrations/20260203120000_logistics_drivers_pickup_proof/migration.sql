-- CreateTable
CREATE TABLE "logistics_drivers" (
    "id" TEXT NOT NULL,
    "logisticsPartnerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_drivers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "missions" ADD COLUMN "assignedLogisticsDriverId" TEXT;

-- AlterTable
ALTER TABLE "logistics_handovers" ADD COLUMN "pickupDriverId" TEXT;
ALTER TABLE "logistics_handovers" ADD COLUMN "pickupDriverSnapshot" JSONB;
ALTER TABLE "logistics_handovers" ADD COLUMN "pickupBadgePhotoUrl" TEXT;
ALTER TABLE "logistics_handovers" ADD COLUMN "pickupDriverSignatureUrl" TEXT;

-- CreateIndex
CREATE INDEX "logistics_drivers_logisticsPartnerId_idx" ON "logistics_drivers"("logisticsPartnerId");

-- CreateIndex
CREATE INDEX "logistics_drivers_isActive_idx" ON "logistics_drivers"("isActive");

-- CreateIndex
CREATE INDEX "missions_assignedLogisticsDriverId_idx" ON "missions"("assignedLogisticsDriverId");

-- CreateIndex
CREATE INDEX "logistics_handovers_pickupDriverId_idx" ON "logistics_handovers"("pickupDriverId");

-- AddForeignKey
ALTER TABLE "logistics_drivers" ADD CONSTRAINT "logistics_drivers_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_assignedLogisticsDriverId_fkey" FOREIGN KEY ("assignedLogisticsDriverId") REFERENCES "logistics_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_handovers" ADD CONSTRAINT "logistics_handovers_pickupDriverId_fkey" FOREIGN KEY ("pickupDriverId") REFERENCES "logistics_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
