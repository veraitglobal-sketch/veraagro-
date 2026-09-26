ALTER TABLE "batches" ADD COLUMN "harvestAnnouncementId" TEXT;
CREATE INDEX "batches_harvestAnnouncementId_idx" ON "batches"("harvestAnnouncementId");
ALTER TABLE "batches" ADD CONSTRAINT "batches_harvestAnnouncementId_fkey"
  FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Legacy lots remain unlinked: parcel proximity is not evidence of their harvest plan.
