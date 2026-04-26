-- Store postal/ZIP; lat/lng derived via geocoding (no manual entry required)
ALTER TABLE "material_supplier_profiles" ADD COLUMN "postalCode" TEXT;
