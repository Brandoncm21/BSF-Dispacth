-- ============================================================
-- PHASE 1: REENGINEERING ACTIVES & FLEET LOGIC
-- Generated: 2026-05-13
-- Author: OpenCode Agent (Spec-Driven Development)
-- ============================================================

-- ============================================================
-- 1. SCHEMA SYNC: Remove dispatch_fee from loads
-- The dispatch_fee is now computed dynamically:
--   dispatch_fee = rate * carrier.dispatch_fee_percent
-- NOT stored in the loads table
-- ============================================================

-- Remove dispatch_fee column (computed dynamically, not stored)
ALTER TABLE loads DROP COLUMN IF EXISTS dispatch_fee;

-- Rename load_weight -> weight_lbs (already done in previous migration)
-- This is just documentation that the column was renamed
-- The actual rename was done via: ALTER TABLE loads RENAME COLUMN load_weight TO weight_lbs;

-- ============================================================
-- 2. TRUCKS: Add missing columns for new spec
-- ============================================================

-- Add plate_number (text)
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS plate_number TEXT;

-- Add vin (text, unique)
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS vin TEXT;

-- Add truck_name (text)
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS truck_name TEXT;

-- Add empty_weight (numeric)
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS empty_weight NUMERIC(10,2);

-- Add driver_id (FK to drivers) - already exists but ensure it's properly typed
-- This links a default driver to each truck

-- Add UNIQUE constraints (must be applied separately if data exists)
-- UNIQUE INDEXES will be created after data cleanup

-- ============================================================
-- 3. DRIVERS: Add has_twic_card field
-- ============================================================

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS has_twic_card BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 4. MAINTENANCE_RECORDS: Ensure table exists with proper structure
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_records (
    maintenance_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    truck_id INTEGER REFERENCES trucks(truck_id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL,
    maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mileage INTEGER,
    description TEXT,
    cost NUMERIC(10,2),
    mechanic_notes TEXT,
    status_id INTEGER REFERENCES record_status(status_id) DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries by truck_id and date
CREATE INDEX IF NOT EXISTS idx_maintenance_truck_id ON maintenance_records(truck_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(maintenance_date DESC);

-- ============================================================
-- 5. CARRIER: Rename first_name -> company_name, last_name -> owner_name
-- (Already done in previous migration, this is documentation)
-- ============================================================

-- The carriers table has been updated:
-- - company_name (VARCHAR) - the trading/company name
-- - owner_name (VARCHAR) - the owner's full name
-- - dispatch_fee_percent (NUMERIC(5,4)) - the commission rate

-- ============================================================
-- 6. SEARCH FUNCTIONS: Update to use computed dispatch_fee
-- ============================================================

-- search_loads: Remove dispatch_fee from returned columns
-- It is now computed client-side as: rate * carrier.dispatch_fee_percent

CREATE OR REPLACE FUNCTION search_loads(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 16,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  load_id INTEGER,
  load_number TEXT,
  load_data TEXT,
  weight_lbs NUMERIC,
  rate NUMERIC,
  dispatch_fee_pct NUMERIC,
  load_status TEXT,
  paid_status TEXT,
  factoring BOOLEAN,
  carrier_id INTEGER,
  truck_id INTEGER,
  driver_id INTEGER,
  route_id INTEGER,
  cargo_type_id INTEGER,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  carrier_name TEXT,
  carrier_company_name TEXT,
  driver_name TEXT,
  unit_number TEXT,
  miles NUMERIC,
  cargo_type_name TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.load_id,
    l.load_number::TEXT,
    l.load_data::TEXT,
    l.weight_lbs,
    l.rate,
    l.dispatch_fee_pct,
    l.load_status::TEXT,
    l.paid_status::TEXT,
    l.factoring,
    l.carrier_id,
    l.truck_id,
    l.driver_id,
    l.route_id,
    l.cargo_type_id,
    l.picked_up_at,
    l.delivered_at,
    (c.company_name)::TEXT AS carrier_name,
    (c.company_name)::TEXT AS carrier_company_name,
    (d.first_name || ' ' || d.last_name)::TEXT AS driver_name,
    t.unit_number::TEXT,
    r.miles,
    ct.cargo_type_name::TEXT,
    COUNT(*) OVER() AS total_count
  FROM loads l
  LEFT JOIN carriers c ON l.carrier_id = c.carrier_id
  LEFT JOIN drivers d ON l.driver_id = d.driver_id
  LEFT JOIN trucks t ON l.truck_id = t.truck_id
  LEFT JOIN routes r ON l.route_id = r.route_id
  LEFT JOIN cargo_types ct ON l.cargo_type_id = ct.cargo_type_id
  WHERE l.status_id = 1
  AND (p_search IS NULL OR
    LOWER(COALESCE(l.load_number, '')) LIKE LOWER('%' || p_search || '%') OR
    LOWER(COALESCE(l.load_data, '')) LIKE LOWER('%' || p_search || '%'))
  AND (p_status IS NULL OR l.load_status = p_status)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 7. TRUCK FUNCTIONS: Update to include new fields
-- ============================================================

-- get_truck_load_history: Remove dispatch_fee from returned columns
CREATE OR REPLACE FUNCTION get_truck_load_history(
  p_truck_id INTEGER,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  load_id INTEGER,
  load_number TEXT,
  load_date TEXT,
  origin TEXT,
  destination TEXT,
  load_status TEXT,
  rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.load_id,
    l.load_number::TEXT,
    COALESCE(l.picked_up_at::TEXT, l.created_at::TEXT) AS load_date,
    orig_addr.address_description::TEXT AS origin,
    dest_addr.address_description::TEXT AS destination,
    l.load_status::TEXT,
    l.rate
  FROM loads l
  JOIN routes r ON l.route_id = r.route_id
  LEFT JOIN addresses orig_addr ON r.origin_address_id = orig_addr.address_id
  LEFT JOIN addresses dest_addr ON r.destination_address_id = dest_addr.address_id
  WHERE l.truck_id = p_truck_id
  AND l.status_id = 1
  AND l.created_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 8. SEARCH_TRUCKS: Update to use company_name for carrier
-- ============================================================

CREATE OR REPLACE FUNCTION search_trucks(
  p_search TEXT DEFAULT NULL,
  p_status_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 16,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  truck_id INTEGER,
  unit_number TEXT,
  plate_number TEXT,
  vin TEXT,
  truck_name TEXT,
  vehicle_type TEXT,
  capacity TEXT,
  empty_weight NUMERIC,
  operational_status TEXT,
  carrier_id INTEGER,
  carrier_company_name TEXT,
  driver_id INTEGER,
  driver_first_name TEXT,
  driver_last_name TEXT,
  status_id INTEGER,
  status_name TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.truck_id,
    t.unit_number::TEXT,
    t.plate_number::TEXT,
    t.vin::TEXT,
    t.truck_name::TEXT,
    COALESCE(t.vehicle_type, 'N/A')::TEXT AS vehicle_type,
    t.capacity::TEXT,
    t.empty_weight,
    COALESCE(t.operational_status, 'Activo')::TEXT AS operational_status,
    t.carrier_id,
    COALESCE(c.company_name, 'Sin Carrier')::TEXT AS carrier_company_name,
    t.driver_id,
    d.first_name::TEXT AS driver_first_name,
    d.last_name::TEXT AS driver_last_name,
    t.status_id,
    rs.status_name::TEXT,
    COUNT(*) OVER() AS total_count
  FROM trucks t
  LEFT JOIN carriers c ON t.carrier_id = c.carrier_id
  LEFT JOIN drivers d ON t.driver_id = d.driver_id
  JOIN record_status rs ON t.status_id = rs.status_id
  WHERE (p_search IS NULL OR
    LOWER(t.unit_number) LIKE LOWER('%' || p_search || '%') OR
    LOWER(t.plate_number) LIKE LOWER('%' || p_search || '%') OR
    LOWER(t.vin) LIKE LOWER('%' || p_search || '%') OR
    LOWER(c.company_name) LIKE LOWER('%' || p_search || '%'))
  AND (p_status_id IS NULL OR t.status_id = p_status_id)
  ORDER BY t.unit_number
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 9. SEARCH_DRIVERS: Update to use company_name for carrier
-- ============================================================

CREATE OR REPLACE FUNCTION search_drivers(
  p_search TEXT DEFAULT NULL,
  p_status_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 16,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  driver_id INTEGER,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  license_type TEXT,
  cdl_number TEXT,
  carrier_id INTEGER,
  carrier_company_name TEXT,
  has_twic_card BOOLEAN,
  status_id INTEGER,
  status_name TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.driver_id,
    d.first_name::TEXT,
    d.last_name::TEXT,
    COALESCE(d.phone_number, '')::TEXT AS phone_number,
    COALESCE(d.license_type, '')::TEXT AS license_type,
    d.cdl_number::TEXT,
    d.carrier_id,
    COALESCE(c.company_name, 'Sin Carrier')::TEXT AS carrier_company_name,
    d.has_twic_card,
    d.status_id,
    rs.status_name::TEXT,
    COUNT(*) OVER() AS total_count
  FROM drivers d
  LEFT JOIN carriers c ON d.carrier_id = c.carrier_id
  JOIN record_status rs ON d.status_id = rs.status_id
  WHERE (p_search IS NULL OR
    LOWER(d.first_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(d.last_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(d.cdl_number) LIKE LOWER('%' || p_search || '%'))
  AND (p_status_id IS NULL OR d.status_id = p_status_id)
  ORDER BY d.first_name, d.last_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 10. GET_DRIVERS_BY_CARRIER: Already exists, no changes needed
-- ============================================================

-- ============================================================
-- 11. GET_TRUCKS_BY_CARRIER: Already exists, no changes needed
-- ============================================================

-- ============================================================
-- 12. NOTES FOR MANUAL EXECUTION
-- ============================================================
-- If unique constraints fail due to existing data:
-- 1. Clean duplicate VINs: UPDATE trucks SET vin = NULL WHERE truck_id IN (SELECT truck_id FROM trucks GROUP BY vin HAVING COUNT(*) > 1);
-- 2. Clean duplicate unit_numbers: UPDATE trucks SET unit_number = unit_number || '-' || truck_id WHERE truck_id IN (SELECT truck_id FROM trucks GROUP BY unit_number HAVING COUNT(*) > 1);
-- 3. Then apply: ALTER TABLE trucks ADD CONSTRAINT trucks_vin_unique UNIQUE (vin);
-- 4. ALTER TABLE trucks ADD CONSTRAINT trucks_unit_number_unique UNIQUE (unit_number);