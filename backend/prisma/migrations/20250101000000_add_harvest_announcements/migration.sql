-- CreateTable
CREATE TABLE "harvest_announcements" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "estimatedDate" TIMESTAMP(3) NOT NULL,
    "estimatedQuantity" DOUBLE PRECISION,
    "actualDate" TIMESTAMP(3),
    "actualQuantity" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "harvest_announcements_parcelId_idx" ON "harvest_announcements"("parcelId");

-- CreateIndex
CREATE INDEX "harvest_announcements_userId_idx" ON "harvest_announcements"("userId");

-- CreateIndex
CREATE INDEX "harvest_announcements_estimatedDate_idx" ON "harvest_announcements"("estimatedDate");

-- CreateIndex
CREATE INDEX "harvest_announcements_status_idx" ON "harvest_announcements"("status");

-- AddForeignKey
ALTER TABLE "harvest_announcements" ADD CONSTRAINT "harvest_announcements_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_announcements" ADD CONSTRAINT "harvest_announcements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
