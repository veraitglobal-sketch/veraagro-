-- AlterTable
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "parcels_approvedByUserId_idx" ON "parcels"("approvedByUserId");

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
