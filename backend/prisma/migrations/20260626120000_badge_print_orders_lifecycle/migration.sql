-- CreateEnum
CREATE TYPE "BadgePrintOrderStatus" AS ENUM ('DRAFT', 'SENT_TO_PRINTER', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageBadgeLifecycle" AS ENUM ('ACTIVE', 'RETURNED_TO_SUPPLIER');

-- AlterTable
ALTER TABLE "package_badges" ADD COLUMN     "lifecycle" "PackageBadgeLifecycle" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "printOrderId" TEXT;

-- CreateTable
CREATE TABLE "badge_print_orders" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "printerSupplierId" TEXT,
    "parentCount" INTEGER NOT NULL,
    "childrenPerParent" INTEGER NOT NULL,
    "serialPrefix" TEXT NOT NULL DEFAULT 'PLT',
    "planJson" JSONB NOT NULL,
    "notesToPrinter" TEXT,
    "status" "BadgePrintOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_print_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_badges_printOrderId_idx" ON "package_badges"("printOrderId");

-- CreateIndex
CREATE INDEX "package_badges_lifecycle_idx" ON "package_badges"("lifecycle");

-- CreateIndex
CREATE INDEX "badge_print_orders_requesterUserId_createdAt_idx" ON "badge_print_orders"("requesterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "badge_print_orders_printerSupplierId_idx" ON "badge_print_orders"("printerSupplierId");

-- CreateIndex
CREATE INDEX "badge_print_orders_status_idx" ON "badge_print_orders"("status");

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_printOrderId_fkey" FOREIGN KEY ("printOrderId") REFERENCES "badge_print_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_print_orders" ADD CONSTRAINT "badge_print_orders_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_print_orders" ADD CONSTRAINT "badge_print_orders_printerSupplierId_fkey" FOREIGN KEY ("printerSupplierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
