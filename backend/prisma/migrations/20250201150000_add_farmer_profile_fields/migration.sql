-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerQrCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerProfileUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerPhoto" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerBio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "generation" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_farmerQrCode_key" ON "users"("farmerQrCode");
