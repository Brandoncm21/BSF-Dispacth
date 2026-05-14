-- ============================================================
-- Search & Utility RPC Functions
-- Versioned from live Supabase database
-- ============================================================

-- ============================================================
-- search_carriers
-- ============================================================
DROP FUNCTION IF EXISTS search_carriers(TEXT, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_carriers(
  p_search TEXT DEFAULT NULL,
  p_status_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 16,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  carrier_id INTEGER,
  company_name TEXT,
  owner_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  motor_carrier_id TEXT,
  mc_number TEXT,
  dot_number TEXT,
  factoring BOOLEAN,
  dispatch_fee_percent NUMERIC,
  status_id INTEGER,
  status_name TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.carrier_id,
    COALESCE(c.company_name, c.first_name)::TEXT AS company_name,
    c.owner_name::TEXT,
    c.first_name::TEXT,
    c.last_name::TEXT,
    c.email::TEXT,
    c.phone_number::TEXT,
    c.motor_carrier_id::TEXT,
    c.mc_number::TEXT,
    c.dot_number::TEXT,
    c.factoring,
    c.dispatch_fee_percent,
    c.status_id,
    rs.status_name::TEXT,
    COUNT(*) OVER() AS total_count
  FROM carriers c
  JOIN record_status rs ON c.status_id = rs.status_id
  WHERE (p_search IS NULL OR
    LOWER(COALESCE(c.company_name, c.first_name)) LIKE LOWER('%' || p_search || '%') OR
    LOWER(COALESCE(c.owner_name, c.last_name)) LIKE LOWER('%' || p_search || '%') OR
    LOWER(COALESCE(c.motor_carrier_id, '')) LIKE LOWER('%' || p_search || '%'))
  AND (p_status_id IS NULL OR c.status_id = p_status_id)
  ORDER BY COALESCE(c.company_name, c.first_name), COALESCE(c.owner_name, c.last_name)
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- search_drivers
-- ============================================================
DROP FUNCTION IF EXISTS search_drivers(TEXT, INTEGER, INTEGER, INTEGER);
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
  carrier_first_name TEXT,
  carrier_last_name TEXT,
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
    d.phone_number::TEXT,
    d.license_type::TEXT,
    d.cdl_number::TEXT,
    d.carrier_id,
    c.first_name::TEXT AS carrier_first_name,
    c.last_name::TEXT AS carrier_last_name,
    d.status_id,
    rs.status_name::TEXT,
    COUNT(*) OVER() AS total_count
  FROM drivers d
  JOIN carriers c ON d.carrier_id = c.carrier_id
  JOIN record_status rs ON d.status_id = rs.status_id
  WHERE (p_search IS NULL OR
    LOWER(d.first_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(d.last_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(COALESCE(d.cdl_number, '')) LIKE LOWER('%' || p_search || '%'))
  AND (p_status_id IS NULL OR d.status_id = p_status_id)
  ORDER BY d.first_name, d.last_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- search_brokers (updated with mc_number, usdot_number)
-- ============================================================
DROP FUNCTION IF EXISTS search_brokers(TEXT, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_brokers(
  p_search TEXT DEFAULT NULL,
  p_status_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 16,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  broker_id INTEGER,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  mc_number TEXT,
  usdot_number TEXT,
  status_id INTEGER,
  status_name TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.broker_id,
    b.first_name::TEXT,
    b.last_name::TEXT,
    b.email::TEXT,
    b.phone_number::TEXT,
    b.mc_number::TEXT,
    b.usdot_number::TEXT,
    b.status_id,
    rs.status_name::TEXT,
    COUNT(*) OVER() AS total_count
  FROM brokers b
  JOIN record_status rs ON b.status_id = rs.status_id
  WHERE (p_search IS NULL OR
    LOWER(b.first_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(b.last_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(COALESCE(b.email, '')) LIKE LOWER('%' || p_search || '%'))
  AND (p_status_id IS NULL OR b.status_id = p_status_id)
  ORDER BY b.first_name, b.last_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- search_trucks
-- ============================================================
DROP FUNCTION IF EXISTS search_trucks(TEXT, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_trucks(
  p_search TEXT DEFAULT NULL,
  p_status_id INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 16,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  truck_id INTEGER,
  unit_number TEXT,
  vehicle_type TEXT,
  capacity NUMERIC,
  operational_status TEXT,
  carrier_id INTEGER,
  carrier_first_name TEXT,
  carrier_last_name TEXT,
  status_id INTEGER,
  status_name TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.truck_id,
    t.unit_number::TEXT,
    t.vehicle_type::TEXT,
    t.capacity,
    t.operational_status::TEXT,
    t.carrier_id,
    c.first_name::TEXT AS carrier_first_name,
    c.last_name::TEXT AS carrier_last_name,
    t.status_id,
    rs.status_name::TEXT,
    COUNT(*) OVER() AS total_count
  FROM trucks t
  JOIN carriers c ON t.carrier_id = c.carrier_id
  JOIN record_status rs ON t.status_id = rs.status_id
  WHERE (p_search IS NULL OR
    LOWER(t.unit_number) LIKE LOWER('%' || p_search || '%') OR
    LOWER(c.first_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(c.last_name) LIKE LOWER('%' || p_search || '%'))
  AND (p_status_id IS NULL OR t.status_id = p_status_id)
  ORDER BY t.unit_number
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- search_loads
-- ============================================================
DROP FUNCTION IF EXISTS search_loads(TEXT, TEXT, INTEGER, INTEGER);
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
  load_weight NUMERIC,
  rate NUMERIC,
  dispatch_fee NUMERIC,
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
    l.load_weight,
    l.rate,
    l.dispatch_fee,
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
    (c.first_name || ' ' || c.last_name)::TEXT AS carrier_name,
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
-- get_trucks_with_smart_status
-- ============================================================
DROP FUNCTION IF EXISTS get_trucks_with_smart_status();
CREATE OR REPLACE FUNCTION get_trucks_with_smart_status()
RETURNS TABLE(
  truck_id INTEGER,
  unit_number TEXT,
  vehicle_type TEXT,
  carrier_id INTEGER,
  carrier_name TEXT,
  operational_status TEXT,
  current_load_id INTEGER,
  current_load_number TEXT,
  smart_status TEXT,
  status_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.truck_id,
    t.unit_number::TEXT,
    COALESCE(t.vehicle_type, 'N/A')::TEXT,
    t.carrier_id,
    (c.first_name || ' ' || c.last_name)::TEXT AS carrier_name,
    COALESCE(t.operational_status, '')::TEXT,
    active_load.load_id AS current_load_id,
    active_load.load_number::TEXT AS current_load_number,
    CASE
      WHEN LOWER(t.operational_status) IN ('activo', 'active', 'available') THEN 'active'
      WHEN LOWER(t.operational_status) LIKE '%mantenimiento%' OR LOWER(t.operational_status) LIKE '%maintenance%' THEN 'maintenance'
      WHEN LOWER(t.operational_status) LIKE '%ruta%' OR LOWER(t.operational_status) LIKE '%route%' OR LOWER(t.operational_status) = 'in_route' THEN 'in_route'
      ELSE 'inactive'
    END::TEXT AS smart_status,
    CASE
      WHEN LOWER(t.operational_status) IN ('activo', 'active', 'available') THEN 'Disponible'
      WHEN LOWER(t.operational_status) LIKE '%mantenimiento%' OR LOWER(t.operational_status) LIKE '%maintenance%' THEN 'En mantenimiento'
      WHEN LOWER(t.operational_status) LIKE '%ruta%' OR LOWER(t.operational_status) LIKE '%route%' OR LOWER(t.operational_status) = 'in_route' THEN 'En ruta activa'
      ELSE 'Sin asignar'
    END::TEXT AS status_reason
  FROM trucks t
  JOIN carriers c ON t.carrier_id = c.carrier_id
  LEFT JOIN LATERAL (
    SELECT l.load_id, l.load_number
    FROM loads l
    WHERE l.truck_id = t.truck_id
    AND l.load_status IN ('pending', 'booked', 'picked_up')
    AND l.status_id = 1
    ORDER BY l.created_at DESC
    LIMIT 1
  ) active_load ON true
  WHERE t.status_id = 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- get_truck_load_history
-- ============================================================
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
    orig_addr.address_description::TEXT AS origin,
    dest_addr.address_description::TEXT AS destination,
    l.load_status::TEXT,
    l.rate,
    l.dispatch_fee
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
-- get_current_user_role (corrected)
-- ============================================================
DROP FUNCTION IF EXISTS get_current_user_role();
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TABLE(role_type VARCHAR(20)) AS $$
BEGIN
  RETURN QUERY
  SELECT r.role_type::VARCHAR(20)
  FROM auth.users au
  JOIN employees e ON e.auth_user_id = au.id
  JOIN roles r ON r.role_id = e.role_id
  WHERE au.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;