-- ============================================================
-- BestFreight - create_route_full SQL function
-- Replaces 14+ sequential TS queries with a single RPC call
-- All get-or-create logic runs in one DB transaction
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_create_city(p_city_name TEXT, p_state_id INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_city_id INT;
BEGIN
  SELECT city_id INTO v_city_id FROM cities WHERE city_name = p_city_name AND state_id = p_state_id;
  IF NOT FOUND THEN
    INSERT INTO cities (city_name, state_id) VALUES (p_city_name, p_state_id) RETURNING city_id INTO v_city_id;
  END IF;
  RETURN v_city_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_or_create_street(p_street_name TEXT, p_city_id INT, p_state_id INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_street_id INT;
BEGIN
  SELECT street_id INTO v_street_id FROM streets WHERE street_name = p_street_name AND city_id = p_city_id AND state_id = p_state_id;
  IF NOT FOUND THEN
    INSERT INTO streets (street_name, city_id, state_id) VALUES (p_street_name, p_city_id, p_state_id) RETURNING street_id INTO v_street_id;
  END IF;
  RETURN v_street_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_or_create_address(p_street_id INT, p_state_id INT, p_description TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_address_id INT;
BEGIN
  SELECT address_id INTO v_address_id FROM addresses WHERE street_id = p_street_id AND state_id = p_state_id;
  IF NOT FOUND THEN
    INSERT INTO addresses (street_id, state_id, address_description) VALUES (p_street_id, p_state_id, p_description) RETURNING address_id INTO v_address_id;
  END IF;
  RETURN v_address_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_route_full(
  p_origin_street TEXT,
  p_origin_city_id INT,
  p_origin_state_id INT,
  p_dest_street TEXT,
  p_dest_city_id INT,
  p_dest_state_id INT,
  p_miles NUMERIC
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_origin_street_id INT;
  v_origin_address_id INT;
  v_dest_street_id INT;
  v_dest_address_id INT;
  v_route_id INT;
BEGIN
  -- Get or create origin street + address
  v_origin_street_id := get_or_create_street(p_origin_street, p_origin_city_id, p_origin_state_id);
  v_origin_address_id := get_or_create_address(v_origin_street_id, p_origin_state_id, p_origin_street);

  -- Get or create destination street + address
  v_dest_street_id := get_or_create_street(p_dest_street, p_dest_city_id, p_dest_state_id);
  v_dest_address_id := get_or_create_address(v_dest_street_id, p_dest_state_id, p_dest_street);

  -- Check if route already exists
  SELECT route_id INTO v_route_id FROM routes
    WHERE origin_address_id = v_origin_address_id AND destination_address_id = v_dest_address_id;

  IF NOT FOUND THEN
    INSERT INTO routes (origin_address_id, destination_address_id, miles, status_id)
    VALUES (v_origin_address_id, v_dest_address_id, p_miles, 1)
    RETURNING route_id INTO v_route_id;
  END IF;

  RETURN v_route_id;
END;
$$;
