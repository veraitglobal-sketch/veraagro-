-- Historical harvests remain unlinked; their planting must not be guessed.
ALTER TABLE "harvest_announcements" ADD COLUMN "sourcePlantingId" TEXT;
CREATE INDEX "harvest_announcements_sourcePlantingId_idx" ON "harvest_announcements"("sourcePlantingId");
ALTER TABLE "harvest_announcements" ADD CONSTRAINT "harvest_announcements_sourcePlantingId_fkey"
  FOREIGN KEY ("sourcePlantingId") REFERENCES "harvest_announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
