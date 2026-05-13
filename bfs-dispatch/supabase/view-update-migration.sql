-- ============================================================
-- BestFreight - Update trucks_with_availability view
-- Adds current_load_id, current_load_number, current_load_created_at
-- ============================================================

CREATE OR REPLACE VIEW trucks_with_availability AS
 SELECT
    t.truck_id,
    t.unit_number,
    t.vehicle_type,
    t.capacity,
    t.operational_status,
    t.carrier_id,
    ((c.first_name::text || ' '::text) || c.last_name::text) AS carrier_name,
    rs.status_name AS record_status,
        CASE
            WHEN t.operational_status::text = 'En mantenimiento'::text THEN 'maintenance'::text
            WHEN (EXISTS ( SELECT 1
               FROM loads l
              WHERE l.truck_id = t.truck_id AND (l.load_status::text = ANY (ARRAY['pending'::character varying, 'booked'::character varying, 'picked_up'::character varying]::text[])) AND l.status_id = 1)) THEN 'en_ruta'::text
            ELSE 'disponible'::text
        END AS availability_status,
    ( SELECT concat_ws(' → '::text, (orig_city.city_name::text || ', '::text) || orig_state.state_name::text, (dest_city.city_name::text || ', '::text) || dest_state.state_name::text) AS concat_ws
           FROM loads l
             JOIN routes r ON l.route_id = r.route_id
             JOIN addresses orig_addr ON r.origin_address_id = orig_addr.address_id
             JOIN streets orig_st ON orig_addr.street_id = orig_st.street_id
             JOIN cities orig_city ON orig_st.city_id = orig_city.city_id
             JOIN states orig_state ON orig_addr.state_id = orig_state.state_id
             JOIN addresses dest_addr ON r.destination_address_id = dest_addr.address_id
             JOIN streets dest_st ON dest_addr.street_id = dest_st.street_id
             JOIN cities dest_city ON dest_st.city_id = dest_city.city_id
             JOIN states dest_state ON dest_addr.state_id = dest_state.state_id
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
