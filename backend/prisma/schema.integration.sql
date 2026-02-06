-- ============================================
-- BIOVERA CORE SCHEMA INTEGRATION
-- ============================================
-- SQL script to add relations to existing models
-- Run this after adding new models from schema.biovera-core.prisma

-- Add relations to User model (if not already present)
-- Note: These are Prisma relations, but we document them here for reference

-- Add relations to Estate model
-- Note: These relations are defined in Prisma schema, not SQL

-- Add relations to Parcel model
-- Note: These relations are defined in Prisma schema, not SQL

-- Add relations to Hub model
-- Note: These relations are defined in Prisma schema, not SQL

-- Add relations to Batch model
-- Note: These relations are defined in Prisma schema, not SQL

-- ============================================
-- TRACEABILITY VIEW (PostgreSQL View)
-- ============================================
-- Complete traceability from seed to retail product

CREATE OR REPLACE VIEW seed_to_retail_traceability AS
SELECT 
  -- Seed Information
  si.id as seed_inventory_id,
  si.batch_number as seed_batch,
  si.serial_number as seed_serial,
  si.seed_type,
  si.variety,
  si.planted_at as seed_planted_at,
  
  -- Farmer Information
  f.user_id as farmer_id,
  u.first_name || ' ' || u.last_name as farmer_name,
  f.is_vera_partner,
  f.current_trust_score,
  
  -- Estate Information
  e.id as estate_id,
  e.name as estate_name,
  e.city as estate_city,
  e.country as estate_country,
  
  -- Parcel Information
  p.id as parcel_id,
  p.crop_type as parcel_crop_type,
  
  -- Shipment Information
  s.id as shipment_id,
  s.shipment_number,
  s.qr_code_id as shipment_qr,
  s.product_name,
  s.quantity as shipment_quantity,
  s.unit as shipment_unit,
  s.status as shipment_status,
  s.harvested_at,
  s.packed_at,
  s.shipped_at,
  s.arrived_at_hub,
  s.delivered_at,
  s.vera_bonus_amount,
  
  -- Product Information
  pr.id as product_id,
  pr.product_code,
  pr.qr_code_id as product_qr,
  pr.status as product_status,
  pr.current_retail_location,
  pr.current_retail_chain,
  pr.sold_at,
  
  -- Timeline
  AGE(pr.sold_at, si.planted_at) as seed_to_sale_duration,
  AGE(s.harvested_at, si.planted_at) as seed_to_harvest_duration,
  AGE(pr.sold_at, s.harvested_at) as harvest_to_sale_duration
  
FROM seed_inventory si
LEFT JOIN seed_assignments sa ON sa.seed_inventory_id = si.id
LEFT JOIN shipments s ON s.seed_inventory_id = si.id
LEFT JOIN products pr ON pr.shipment_id = s.id AND pr.seed_inventory_id = si.id
LEFT JOIN farmer_profiles f ON s.farmer_id = f.user_id
LEFT JOIN users u ON f.user_id = u.id
LEFT JOIN estates e ON s.estate_id = e.id
LEFT JOIN parcels p ON si.planted_parcel_id = p.id
WHERE pr.status IN ('IN_RETAIL', 'SOLD')
   OR s.status IN ('IN_TRANSIT', 'AT_HUB', 'DELIVERED', 'IN_RETAIL');

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_seed_traceability_seed_id ON seed_inventory(id);
CREATE INDEX IF NOT EXISTS idx_seed_traceability_shipment_seed ON shipments(seed_inventory_id);
CREATE INDEX IF NOT EXISTS idx_seed_traceability_product_seed ON products(seed_inventory_id);

-- ============================================
-- COMPLIANCE SUMMARY VIEW
-- ============================================
-- Summary of compliance logs per farmer/estate

CREATE OR REPLACE VIEW compliance_summary AS
SELECT 
  cl.farmer_id,
  cl.estate_id,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE cl.is_compliant = true) as compliant_entries,
  COUNT(*) FILTER (WHERE cl.is_compliant = false) as non_compliant_entries,
  COUNT(*) FILTER (WHERE cl.entry_type = 'FERTILIZER_SCAN') as fertilizer_scans,
  COUNT(*) FILTER (WHERE cl.entry_type = 'BERBA') as harvest_entries,
  MIN(cl.created_at) as first_entry,
  MAX(cl.created_at) as last_entry
FROM compliance_logs cl
GROUP BY cl.farmer_id, cl.estate_id;

-- ============================================
-- VERA BONUS CALCULATION VIEW
-- ============================================
-- Calculate total Vera Bonus per farmer

CREATE OR REPLACE VIEW vera_bonus_summary AS
SELECT 
  s.farmer_id,
  f.is_vera_partner,
  COUNT(*) as total_shipments,
  COUNT(*) FILTER (WHERE s.vera_bonus_eligible = true) as eligible_shipments,
  SUM(s.vera_bonus_amount) as total_bonus_earned,
  SUM(s.vera_bonus_amount) FILTER (WHERE s.vera_bonus_paid = true) as total_bonus_paid,
  SUM(s.vera_bonus_amount) FILTER (WHERE s.vera_bonus_paid = false) as pending_bonus
FROM shipments s
JOIN farmer_profiles f ON s.farmer_id = f.user_id
GROUP BY s.farmer_id, f.is_vera_partner;
