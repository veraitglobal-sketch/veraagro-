-- CreateEnum
CREATE TYPE "ApprovedProductCategory" AS ENUM ('SEED', 'FERTILIZER', 'PLANT_PROTECTION', 'PACKAGING', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovedProductStatus" AS ENUM ('ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "SeedRunStatus" AS ENUM ('PLANNED', 'LABELS_ISSUED', 'PRODUCED', 'RELEASED', 'RECALLED');

-- CreateEnum
CREATE TYPE "SeedCustodyEvent" AS ENUM ('LABEL_ISSUED', 'PRODUCED', 'VOIDED', 'RELEASED', 'ASSIGNED_TO_GROWER', 'SHIPPED_TO_SUPPLIER', 'RECEIVED_BY_SUPPLIER', 'SOLD_TO_GROWER', 'PLANTED', 'RECALLED');

-- AlterEnum
ALTER TYPE "SeedStatus" ADD VALUE 'LABELED';
ALTER TYPE "SeedStatus" ADD VALUE 'VOIDED';
ALTER TYPE "SeedStatus" ADD VALUE 'IN_SUPPLIER_STOCK';
ALTER TYPE "SeedStatus" ADD VALUE 'SOLD';
ALTER TYPE "SeedStatus" ADD VALUE 'PLANTED';
ALTER TYPE "SeedStatus" ADD VALUE 'RECALLED';

-- CreateTable
CREATE TABLE "approved_products" (
    "id" TEXT NOT NULL,
    "category" "ApprovedProductCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "cropType" TEXT,
    "manufacturer" TEXT,
    "isBioVeraBrand" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "imageUrl" TEXT,
    "unit" TEXT NOT NULL,
    "packSize" TEXT,
    "status" "ApprovedProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "instructions" JSONB,
    "instructionsPdfUrl" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approved_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_producers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "licenseNumber" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_producers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_production_runs" (
    "id" TEXT NOT NULL,
    "approvedProductId" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "seedCropYear" INTEGER NOT NULL,
    "productionDate" TIMESTAMP(3),
    "originCountry" TEXT NOT NULL,
    "originRegion" TEXT,
    "bagSizeLabel" TEXT NOT NULL,
    "bagsPlanned" INTEGER NOT NULL,
    "bagsProduced" INTEGER,
    "germinationPct" DOUBLE PRECISION,
    "purityPct" DOUBLE PRECISION,
    "certificateUrls" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "status" "SeedRunStatus" NOT NULL DEFAULT 'PLANNED',
    "recallReason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_production_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_custody_events" (
    "id" TEXT NOT NULL,
    "seedId" TEXT NOT NULL,
    "event" "SeedCustodyEvent" NOT NULL,
    "actorId" TEXT,
    "supplierUserId" TEXT,
    "growerId" TEXT,
    "parcelId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seed_custody_events_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "seeds" ADD COLUMN     "productionRunId" TEXT,
ADD COLUMN     "approvedProductId" TEXT,
ADD COLUMN     "seedCropYear" INTEGER,
ADD COLUMN     "bagNumber" INTEGER,
ADD COLUMN     "supplierUserId" TEXT,
ADD COLUMN     "soldToGrowerId" TEXT,
ADD COLUMN     "soldAt" TIMESTAMP(3),
ADD COLUMN     "plantedParcelId" TEXT,
ADD COLUMN     "plantedAt" TIMESTAMP(3),
ADD COLUMN     "plantingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "seed_producers_userId_key" ON "seed_producers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "seed_production_runs_lotNumber_key" ON "seed_production_runs"("lotNumber");

-- CreateIndex
CREATE INDEX "seed_production_runs_status_idx" ON "seed_production_runs"("status");

-- CreateIndex
CREATE INDEX "seed_custody_events_seedId_createdAt_idx" ON "seed_custody_events"("seedId", "createdAt");

-- CreateIndex
CREATE INDEX "seeds_productionRunId_idx" ON "seeds"("productionRunId");

-- AddForeignKey
ALTER TABLE "seed_production_runs" ADD CONSTRAINT "seed_production_runs_approvedProductId_fkey" FOREIGN KEY ("approvedProductId") REFERENCES "approved_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_production_runs" ADD CONSTRAINT "seed_production_runs_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "seed_producers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_custody_events" ADD CONSTRAINT "seed_custody_events_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "seeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "seed_production_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_approvedProductId_fkey" FOREIGN KEY ("approvedProductId") REFERENCES "approved_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
