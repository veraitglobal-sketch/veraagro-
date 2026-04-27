-- Link grower growth journal rows to a harvest/planting plan (zasad) on the parcel
ALTER TABLE "growth_logs" ADD COLUMN "harvestAnnouncementId" TEXT;

CREATE INDEX "growth_logs_harvestAnnouncementId_idx" ON "growth_logs"("harvestAnnouncementId");

ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_harvestAnnouncementId_fkey" FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
