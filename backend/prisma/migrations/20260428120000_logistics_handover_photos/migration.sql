-- Pallet and truck interior photo evidence for loading handover (before mission is READY_FOR_LOADING).
ALTER TABLE "logistics_handovers" ADD COLUMN "palletPhotos" JSONB;
ALTER TABLE "logistics_handovers" ADD COLUMN "truckInteriorPhotos" JSONB;
