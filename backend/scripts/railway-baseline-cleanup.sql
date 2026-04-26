-- Jednokratno na Railway: (1) uklanjanje zaglavljenih starih migracija, (2) kolone koje fale u bazi a postoje u schema.prisma
-- Zatim: npx prisma migrate resolve --applied 20260426200000_squash_baseline
TRUNCATE TABLE "_prisma_migrations";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "buyerCompanyProfile" JSONB;
