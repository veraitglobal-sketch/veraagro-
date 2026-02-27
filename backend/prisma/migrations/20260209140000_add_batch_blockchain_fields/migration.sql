-- AlterTable
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "blockchainTxHash" TEXT;
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "blockchainRegisteredAt" TIMESTAMP(3);
