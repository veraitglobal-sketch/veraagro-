-- CreateEnum
CREATE TYPE "PackageBadgeType" AS ENUM ('PALLET_MASTER', 'BOX_CHILD', 'ROLL_LINE');

-- AlterTable
ALTER TABLE "logistics_handovers" ADD COLUMN     "receiverName" TEXT,
ADD COLUMN     "receiverSignatureDataUrl" TEXT,
ADD COLUMN     "receiverSignedAt" TIMESTAMP(3),
ADD COLUMN     "receiverProofPdfHash" TEXT;

-- CreateTable
CREATE TABLE "package_badges" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "parentId" TEXT,
    "type" "PackageBadgeType" NOT NULL,
    "ownerUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "batchId" TEXT,
    "farmerQrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_badges_serial_key" ON "package_badges"("serial");

-- CreateIndex
CREATE INDEX "package_badges_parentId_idx" ON "package_badges"("parentId");

-- CreateIndex
CREATE INDEX "package_badges_ownerUserId_idx" ON "package_badges"("ownerUserId");

-- CreateIndex
CREATE INDEX "package_badges_farmerQrCode_idx" ON "package_badges"("farmerQrCode");

-- CreateIndex
CREATE INDEX "package_badges_batchId_idx" ON "package_badges"("batchId");

-- CreateIndex
CREATE INDEX "package_badges_createdAt_idx" ON "package_badges"("createdAt");

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "package_badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
