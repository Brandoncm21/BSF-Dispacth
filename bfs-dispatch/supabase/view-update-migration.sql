-- ============================================================
-- BestFreight - Update trucks_with_availability view
-- Adds current_load_id, current_load_number, current_load_created_at
-- and fuel_type/fuel_cost_per_mile columns.
-- Recreated using locations table (addresses dropped in migration-locations.sql).
-- ============================================================

CREATE OR REPLACE VIEW trucks_with_availability AS
 SELECT
    t.truck_id,
    t.unit_number,
    t.vehicle_type,
    t.capacity,
    t.operational_status,
    t.carrier_id,
    t.fuel_type,
    t.fuel_cost_per_mile,
    ((c.first_name::text || ' '::text) || c.last_name::text) AS carrier_name,
    rs.status_name AS record_status,
        CASE
            WHEN t.operational_status::text = 'En mantenimiento'::text THEN 'maintenance'::text
            WHEN (EXISTS ( SELECT 1
               FROM loads l
              WHERE l.truck_id = t.truck_id AND (l.load_status::text = ANY (ARRAY['pending'::character varying, 'booked'::character varying, 'picked_up'::character varying]::text[])) AND l.status_id = 1)) THEN 'en_ruta'::text
            ELSE 'disponible'::text
        END AS availability_status,
    ( SELECT concat_ws(' → '::text, COALESCE(orig.formatted_address, 'Unknown'), COALESCE(dest.formatted_address, 'Unknown')) AS concat_ws
           FROM loads l
             JOIN routes r ON l.route_id = r.route_id
             LEFT JOIN locations orig ON r.origin_location_id = orig.location_id
             LEFT JOIN locations dest ON r.destination_location_id = dest.location_id
          WHERE l.truck_id = t.truck_id AND (l.load_status::text = ANY (ARRAY['pending'::character varying, 'booked'::character varying, 'picked_up'::character varying]::text[]))
         LIMIT 1) AS current_route,
    ( SELECT l.load_status
           FROM loads l
          WHERE l.truck_id = t.truck_id AND (l.load_status::text = ANY (ARRAY['pending'::character varying, 'booked'::character varying, 'picked_up'::character varying]::text[]))
         LIMIT 1) AS current_load_status,
    ( SELECT l.load_id
           FROM loads l
          WHERE l.truck_id = t.truck_id AND (l.load_status::text = ANY (ARRAY['pending'::character varying, 'booked'::character varying, 'picked_up'::character varying]::text[]))
         LIMIT 1) AS current_load_id,
    ( SELECT l.load_number
           FROM loads l
          WHERE l.truck_id = t.truck_id AND (l.load_status::text = ANY (ARRAY['pending'::character varying, 'booked'::character varying, 'picked_up'::character varying]::text[]))
         LIMIT 1) AS current_load_number,
    ( SELECT l.created_at
           FROM loads l
          WHERE l.truck_id = t.truck_id AND (l.load_status::text = ANY (ARRAY['pending'::character varying, 'booked'::character varying, 'picked_up'::character varying]::text[]))
         LIMIT 1) AS current_load_created_at
   FROM trucks t
     JOIN carriers c ON t.carrier_id = c.carrier_id
     JOIN record_status rs ON t.status_id = rs.status_id;
