-- ============================================================
-- Migration: Create v_sales_performance_extended view
-- Provides per-load financial data for the Reports page grouped
-- by dispatcher, carrier, and truck.
-- Uses denormalized schema (locations, routes) integrated with Mapbox.
-- ============================================================

CREATE OR REPLACE VIEW v_sales_performance_extended AS
SELECT
  l.load_id,
  l.load_number,
  l.rate AS gross_revenue,
  (COALESCE(l.rate, 0) - COALESCE(l.rate * l.dispatch_fee_pct / 100, 0)) AS net_profit,
  l.dispatch_fee_pct,
  l.load_status,
  l.paid_status,
  COALESCE(l.booked_at, l.created_at) AS effective_date,
  e.employee_id AS dispatcher_id,
  COALESCE(e.first_name || ' ' || e.last_name, 'Sin Asignar') AS dispatcher_name,
  c.carrier_id,
  COALESCE(c.company_name, 'Sin Carrier') AS carrier_name,
  t.truck_id,
  t.unit_number,
  t.vehicle_type,
  COALESCE(orig.state, 'N/A') AS origin_state_name,
  COALESCE(dest.state, 'N/A') AS destination_state_name
FROM loads l
LEFT JOIN employees e ON l.dispatcher_id = e.employee_id
LEFT JOIN carriers c ON l.carrier_id = c.carrier_id
LEFT JOIN trucks t ON l.truck_id = t.truck_id
LEFT JOIN routes r ON l.route_id = r.route_id
LEFT JOIN locations orig ON r.origin_location_id = orig.location_id
LEFT JOIN locations dest ON r.destination_location_id = dest.location_id
WHERE l.status_id = 1;
