-- Buyer company profile (JSON): company, delivery locations, staff — shared with buyer portal
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "buyerCompanyProfile" JSONB;
