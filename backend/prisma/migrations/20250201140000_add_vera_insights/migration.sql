-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PriceTrend" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateTable
CREATE TABLE "vera_insights" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "veraScore" INTEGER NOT NULL,
    "historicalDeficit" DOUBLE PRECISION,
    "whyText" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "priceTrend" "PriceTrend" NOT NULL DEFAULT 'STABLE',
    "seedId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vera_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vera_insights_cropName_idx" ON "vera_insights"("cropName");

-- CreateIndex
CREATE INDEX "vera_insights_isActive_idx" ON "vera_insights"("isActive");

-- CreateIndex
CREATE INDEX "vera_insights_veraScore_idx" ON "vera_insights"("veraScore");

-- AddForeignKey
ALTER TABLE "vera_insights" ADD CONSTRAINT "vera_insights_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "seeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vera_insights" ADD CONSTRAINT "vera_insights_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vera_insights" ADD CONSTRAINT "vera_insights_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
