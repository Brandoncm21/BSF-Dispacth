-- ============================================================
-- Migration: Create get_drivers_by_carrier RPC function
-- The fleet-reengineering-migration referenced this function
-- but it was never actually created in the database.
-- ============================================================

DROP FUNCTION IF EXISTS get_drivers_by_carrier(INT);

CREATE OR REPLACE FUNCTION get_drivers_by_carrier(
  p_carrier_id INT
)
RETURNS TABLE(
  driver_id INTEGER,
  first_name TEXT,
  last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.driver_id,
    d.first_name::TEXT,
    d.last_name::TEXT
  FROM drivers d
  WHERE d.status_id = 1
    AND d.carrier_id = p_carrier_id
  ORDER BY d.first_name, d.last_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
