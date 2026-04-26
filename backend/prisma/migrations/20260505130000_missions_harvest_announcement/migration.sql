-- Link transport missions to grower harvest plans so logistics sees a "tour" when a plan is filed
ALTER TABLE "missions" ADD COLUMN "harvestAnnouncementId" TEXT;

CREATE UNIQUE INDEX "missions_harvestAnnouncementId_key" ON "missions"("harvestAnnouncementId");

CREATE INDEX "missions_harvestAnnouncementId_idx" ON "missions"("harvestAnnouncementId");

ALTER TABLE "missions" ADD CONSTRAINT "missions_harvestAnnouncementId_fkey" FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
