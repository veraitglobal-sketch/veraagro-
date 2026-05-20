-- Grower moderation: transport pre-approval + growth photo reject
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'AWAITING_APPROVAL';

ALTER TABLE "growth_logs" ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "growth_logs" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "growth_logs" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);
ALTER TABLE "growth_logs" ADD COLUMN IF NOT EXISTS "moderatedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "growth_logs_moderationStatus_idx" ON "growth_logs"("moderationStatus");
