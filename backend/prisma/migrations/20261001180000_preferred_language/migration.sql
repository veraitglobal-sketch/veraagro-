-- Add user language preference for localized notifications and emails
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT 'en';

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "templateKey" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "templateParams" JSONB;
