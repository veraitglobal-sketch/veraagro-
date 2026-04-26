-- Partner / distributor applications from website (pipeline before MATERIAL_SUPPLIER account)

CREATE TYPE "PartnerApplicationStatus" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'CONTACTED',
  'MEETING_SCHEDULED',
  'NEGOTIATION',
  'APPROVED',
  'REJECTED',
  'ONBOARDED'
);

CREATE TABLE "partner_applications" (
  "id" TEXT NOT NULL,
  "referenceCode" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "pib" TEXT,
  "contactPerson" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "website" TEXT,
  "productType" TEXT,
  "certifications" JSONB,
  "description" TEXT,
  "status" "PartnerApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "internalNotes" TEXT,
  "meetingAt" TIMESTAMP(3),
  "linkedUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_applications_referenceCode_key" ON "partner_applications"("referenceCode");
CREATE INDEX "partner_applications_status_createdAt_idx" ON "partner_applications"("status", "createdAt");
CREATE INDEX "partner_applications_email_idx" ON "partner_applications"("email");
CREATE INDEX "partner_applications_referenceCode_idx" ON "partner_applications"("referenceCode");

ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
