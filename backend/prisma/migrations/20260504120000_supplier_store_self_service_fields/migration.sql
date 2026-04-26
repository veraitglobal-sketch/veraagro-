-- Self-service store: website + split street/house (address remains the display line; sync on write)
ALTER TABLE "material_supplier_profiles" ADD COLUMN "website" TEXT;
ALTER TABLE "material_supplier_profiles" ADD COLUMN "street" TEXT;
ALTER TABLE "material_supplier_profiles" ADD COLUMN "houseNumber" TEXT;
UPDATE "material_supplier_profiles" SET "street" = "address" WHERE "street" IS NULL;
