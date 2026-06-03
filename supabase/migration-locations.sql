-- ============================================================
-- Migration: Denormalize addresses/streets/cities into locations
-- Mapbox Route Integration Phase 1
-- ============================================================

-- ============================================================
-- 1. CREATE TABLE: locations
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
    location_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    formatted_address TEXT NOT NULL,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    mapbox_place_id TEXT UNIQUE,
    source TEXT DEFAULT 'mapbox',
    status_id INTEGER REFERENCES record_status(status_id) DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read locations" ON locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write locations" ON locations FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_locations_formatted_address ON locations(formatted_address);
CREATE INDEX idx_locations_mapbox_place_id ON locations(mapbox_place_id);
CREATE INDEX idx_locations_lat_lng ON locations(lat, lng);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_state ON locations(state);

-- ============================================================
-- 2. MIGRATE EXISTING ADDRESSES -> locations (text only, no geocoding yet)
-- ============================================================
-- Insert all existing address combinations as locations
INSERT INTO locations (formatted_address, street, city, state, source, status_id)
SELECT DISTINCT
    COALESCE(a.address_description, s.street_name || ', ' || c.city_name || ', ' || st.state_name),
    s.street_name,
    c.city_name,
    st.state_name,
    'legacy',
    1
FROM addresses a
JOIN streets s ON a.street_id = s.street_id
JOIN cities c ON s.city_id = c.city_id
JOIN states st ON c.state_id = st.state_id
WHERE a.street_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also insert routes that might reference addresses without streets
INSERT INTO locations (formatted_address, street, city, state, source, status_id)
SELECT DISTINCT
    COALESCE(a.address_description, 'Unknown Address'),
    NULL,
    NULL,
    st.state_name,
    'legacy',
    1
FROM addresses a
LEFT JOIN streets s ON a.street_id = s.street_id
LEFT JOIN cities c ON s.city_id = c.city_id
JOIN states st ON a.state_id = st.state_id
WHERE a.street_id IS NULL OR s.street_id IS NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. ADD location columns to routes
-- ============================================================
ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS origin_location_id INTEGER REFERENCES locations(location_id),
    ADD COLUMN IF NOT EXISTS destination_location_id INTEGER REFERENCES locations(location_id);

-- Populate routes.location_id from existing addresses
UPDATE routes r
SET origin_location_id = (
    SELECT l.location_id
    FROM locations l
    JOIN addresses a ON r.origin_address_id = a.address_id
    JOIN streets s ON a.street_id = s.street_id
    JOIN cities c ON s.city_id = c.city_id
    JOIN states st ON c.state_id = st.state_id
    WHERE l.street = s.street_name AND l.city = c.city_name AND l.state = st.state_name
    LIMIT 1
)
WHERE r.origin_address_id IS NOT NULL;

UPDATE routes r
SET destination_location_id = (
    SELECT l.location_id
    FROM locations l
    JOIN addresses a ON r.destination_address_id = a.address_id
    JOIN streets s ON a.street_id = s.street_id
    JOIN cities c ON s.city_id = c.city_id
    JOIN states st ON c.state_id = st.state_id
    WHERE l.street = s.street_name AND l.city = c.city_name AND l.state = st.state_name
    LIMIT 1
)
WHERE r.destination_address_id IS NOT NULL;

-- For routes without matching locations, create them
INSERT INTO locations (formatted_address, street, city, state, source, status_id)
SELECT DISTINCT
    COALESCE(a.address_description, 'Address ' || a.address_id),
    s.street_name,
    c.city_name,
    st.state_name,
    'legacy_route',
    1
FROM routes r
JOIN addresses a ON r.origin_address_id = a.address_id
JOIN streets s ON a.street_id = s.street_id
JOIN cities c ON s.city_id = c.city_id
JOIN states st ON c.state_id = st.state_id
WHERE r.origin_location_id IS NULL
ON CONFLICT DO NOTHING;

UPDATE routes r
SET origin_location_id = (
    SELECT l.location_id
    FROM locations l
    JOIN addresses a ON r.origin_address_id = a.address_id
    JOIN streets s ON a.street_id = s.street_id
    JOIN cities c ON s.city_id = c.city_id
    JOIN states st ON c.state_id = st.state_id
    WHERE l.street = s.street_name AND l.city = c.city_name AND l.state = st.state_name
    LIMIT 1
)
WHERE r.origin_location_id IS NULL;

-- Same for destination
INSERT INTO locations (formatted_address, street, city, state, source, status_id)
SELECT DISTINCT
    COALESCE(a.address_description, 'Address ' || a.address_id),
    s.street_name,
    c.city_name,
    st.state_name,
    'legacy_route',
    1
FROM routes r
JOIN addresses a ON r.destination_address_id = a.address_id
JOIN streets s ON a.street_id = s.street_id
JOIN cities c ON s.city_id = c.city_id
JOIN states st ON c.state_id = st.state_id
WHERE r.destination_location_id IS NULL
ON CONFLICT DO NOTHING;

UPDATE routes r
SET destination_location_id = (
    SELECT l.location_id
    FROM locations l
    JOIN addresses a ON r.destination_address_id = a.address_id
    JOIN streets s ON a.street_id = s.street_id
    JOIN cities c ON s.city_id = c.city_id
    JOIN states st ON c.state_id = st.state_id
    WHERE l.street = s.street_name AND l.city = c.city_name AND l.state = st.state_name
    LIMIT 1
)
WHERE r.destination_location_id IS NULL;

-- ============================================================
-- 4. DROP address columns from loads
-- ============================================================
ALTER TABLE loads
    DROP COLUMN IF EXISTS origin_address_id,
    DROP COLUMN IF EXISTS destination_address_id;

-- ============================================================
-- 5. REWRITE VIEWS to use locations instead of addresses
-- ============================================================

-- routes_v
DROP VIEW IF EXISTS routes_v;
CREATE OR REPLACE VIEW routes_v AS
SELECT
    r.route_id,
    COALESCE(orig.formatted_address, 'Unknown') AS origin_address,
    COALESCE(dest.formatted_address, 'Unknown') AS destination_address,
    r.estimated_time,
    r.miles,
    rs.status_name
FROM routes r
LEFT JOIN locations orig ON r.origin_location_id = orig.location_id
LEFT JOIN locations dest ON r.destination_location_id = dest.location_id
JOIN record_status rs ON r.status_id = rs.status_id;

-- v_sales_performance (replaces addresses with locations via routes)
DROP VIEW IF EXISTS v_sales_performance;
CREATE OR REPLACE VIEW v_sales_performance AS
SELECT 
  s.sales_id,
  s.sale_date,
  s.total_amount,
  s.total_cost,
  s.total_profit,
  s.profit_pct,
  COALESCE(b.first_name || ' ' || b.last_name, 'Sin Broker') AS broker_name,
  COALESCE(e.first_name || ' ' || e.last_name, 'Sin Dispatcher') AS dispatcher_name,
  COALESCE(orig.state, 'N/A') AS origin_state_name,
  COALESCE(dest.state, 'N/A') AS destination_state_name,
  l.load_number,
  l.rate,
  l.dispatch_fee,
  s.status_id
FROM sales s
LEFT JOIN brokers b ON s.broker_id = b.broker_id
LEFT JOIN employees e ON s.employee_id = e.employee_id
LEFT JOIN sales_details sd ON s.sales_id = sd.sales_id
LEFT JOIN loads l ON sd.load_id = l.load_id
LEFT JOIN routes r ON l.route_id = r.route_id
LEFT JOIN locations orig ON r.origin_location_id = orig.location_id
LEFT JOIN locations dest ON r.destination_location_id = dest.location_id;

-- get_truck_load_history (update to use locations)
DROP FUNCTION IF EXISTS get_truck_load_history(INTEGER, INTEGER);
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
  rate NUMERIC,
  dispatch_fee NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.load_id,
    l.load_number::TEXT,
    COALESCE(l.picked_up_at::TEXT, l.created_at::TEXT) AS load_date,
    COALESCE(orig.formatted_address, 'Unknown')::TEXT AS origin,
    COALESCE(dest.formatted_address, 'Unknown')::TEXT AS destination,
    l.load_status::TEXT,
    l.rate,
    l.dispatch_fee
  FROM loads l
  JOIN routes r ON l.route_id = r.route_id
  LEFT JOIN locations orig ON r.origin_location_id = orig.location_id
  LEFT JOIN locations dest ON r.destination_location_id = dest.location_id
  WHERE l.truck_id = p_truck_id
  AND l.status_id = 1
  AND l.created_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 6. DROP OLD FUNCTIONS
-- ============================================================
DROP FUNCTION IF EXISTS get_or_create_address(INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_or_create_street(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_or_create_city(TEXT, INTEGER);
DROP FUNCTION IF EXISTS create_route_full(TEXT, INTEGER, INTEGER, TEXT, INTEGER, INTEGER, NUMERIC);

-- ============================================================
-- 7. DROP OLD TABLES (after confirming all data migrated)
-- ============================================================
-- First drop FK constraints
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_street_id_fkey;
ALTER TABLE streets DROP CONSTRAINT IF EXISTS streets_city_id_fkey;
ALTER TABLE streets DROP CONSTRAINT IF EXISTS streets_state_id_fkey;
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_state_id_fkey;

-- Drop dependent views that reference old tables (if any remain)
-- Note: routes_v and v_sales_performance already recreated above

-- Drop old RLS policies
DROP POLICY IF EXISTS "Read catalog tables" ON addresses;
DROP POLICY IF EXISTS "Read catalog tables" ON streets;
DROP POLICY IF EXISTS "Read catalog tables" ON cities;

-- Drop tables
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS streets CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- ============================================================
-- 8. DROP OLD INDEXES
-- ============================================================
DROP INDEX IF EXISTS idx_loads_origin_address_id;
DROP INDEX IF EXISTS idx_loads_destination_address_id;

-- ============================================================
-- 9. SYNC SEQUENCE for locations
-- ============================================================
SELECT setval(pg_get_serial_sequence('locations', 'location_id'), coalesce(max(location_id), 1)) FROM locations;
