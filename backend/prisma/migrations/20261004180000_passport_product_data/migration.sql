-- Product passport data: catalog fields, batch/packing snapshots, documents, reports.

ALTER TABLE "catalog_products" ADD COLUMN IF NOT EXISTS "variety" TEXT;
ALTER TABLE "catalog_products" ADD COLUMN IF NOT EXISTS "storageConditions" TEXT;
ALTER TABLE "catalog_products" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "actualPackDate" TIMESTAMP(3);
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "catalogProductId" TEXT;
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "packedByUserId" TEXT;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packedByUserId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packagingType" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "declaredShelfLifeHours" INTEGER;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "declaredExpiresAt" TIMESTAMP(3);

DO $$ BEGIN
  CREATE TYPE "PassportDocumentScope" AS ENUM ('PRODUCT', 'LOT', 'PLANTING', 'ESTATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PassportDocumentType" AS ENUM ('CERTIFICATE', 'LAB_RESULT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PassportDocumentVerificationStatus" AS ENUM ('UPLOADED', 'REVIEWED', 'CONFIRMED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PassportReportStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "passport_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "docType" "PassportDocumentType" NOT NULL,
    "scope" "PassportDocumentScope" NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "fileDocumentId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "PassportDocumentVerificationStatus" NOT NULL DEFAULT 'UPLOADED',
    "estateId" TEXT,
    "catalogProductId" TEXT,
    "batchId" TEXT,
    "plantingId" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "passport_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "passport_reports" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "publicBatchId" TEXT NOT NULL,
    "badgeSerial" TEXT,
    "description" TEXT NOT NULL,
    "photoDocumentId" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "PassportReportStatus" NOT NULL DEFAULT 'NEW',
    "idempotencyKey" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "passport_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "passport_documents_batchId_idx" ON "passport_documents"("batchId");
CREATE INDEX IF NOT EXISTS "passport_documents_catalogProductId_idx" ON "passport_documents"("catalogProductId");
CREATE INDEX IF NOT EXISTS "passport_documents_estateId_idx" ON "passport_documents"("estateId");
CREATE INDEX IF NOT EXISTS "passport_documents_isPublic_idx" ON "passport_documents"("isPublic");

CREATE INDEX IF NOT EXISTS "passport_reports_status_idx" ON "passport_reports"("status");
CREATE INDEX IF NOT EXISTS "passport_reports_publicBatchId_idx" ON "passport_reports"("publicBatchId");
CREATE INDEX IF NOT EXISTS "passport_reports_createdAt_idx" ON "passport_reports"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "passport_reports_reportNumber_key" ON "passport_reports"("reportNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "passport_reports_batchId_idempotencyKey_key" ON "passport_reports"("batchId", "idempotencyKey");

CREATE INDEX IF NOT EXISTS "batches_catalogProductId_idx" ON "batches"("catalogProductId");

DO $$ BEGIN
  ALTER TABLE "batches" ADD CONSTRAINT "batches_catalogProductId_fkey"
    FOREIGN KEY ("catalogProductId") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "passport_documents" ADD CONSTRAINT "passport_documents_catalogProductId_fkey"
    FOREIGN KEY ("catalogProductId") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "passport_documents" ADD CONSTRAINT "passport_documents_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
