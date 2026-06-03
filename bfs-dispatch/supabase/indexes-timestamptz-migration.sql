-- ============================================================
-- BestFreight - Indexes + Timestamptz Fix + created_at
-- ============================================================

-- ============================================================
-- 1. CREATED_AT column on loads
-- ============================================================
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE loads SET created_at = COALESCE(booked_at, NOW()) WHERE created_at IS NULL;

-- ============================================================
-- 2. Fix TIMESTAMP → TIMESTAMPTZ on all timestamp columns
-- ============================================================
ALTER TABLE loads
  ALTER COLUMN booked_at TYPE TIMESTAMPTZ USING booked_at AT TIME ZONE 'UTC',
  ALTER COLUMN picked_up_at TYPE TIMESTAMPTZ USING picked_up_at AT TIME ZONE 'UTC',
  ALTER COLUMN delivered_at TYPE TIMESTAMPTZ USING delivered_at AT TIME ZONE 'UTC',
  ALTER COLUMN paid_at TYPE TIMESTAMPTZ USING paid_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE load_status_history
  ALTER COLUMN changed_at TYPE TIMESTAMPTZ USING changed_at AT TIME ZONE 'UTC';

ALTER TABLE load_documents
  ALTER COLUMN uploaded_at TYPE TIMESTAMPTZ USING uploaded_at AT TIME ZONE 'UTC';

-- ============================================================
-- 3. Missing indexes on loads table
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_loads_truck_id ON loads(truck_id);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_dispatcher_id ON loads(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_loads_route_id ON loads(route_id);
CREATE INDEX IF NOT EXISTS idx_loads_origin_address_id ON loads(origin_address_id);
CREATE INDEX IF NOT EXISTS idx_loads_destination_address_id ON loads(destination_address_id);
CREATE INDEX IF NOT EXISTS idx_loads_cargo_type_id ON loads(cargo_type_id);
CREATE INDEX IF NOT EXISTS idx_loads_special_requirements_id ON loads(special_requirements_id);
CREATE INDEX IF NOT EXISTS idx_loads_paid_status ON loads(paid_status);
CREATE INDEX IF NOT EXISTS idx_loads_created_at ON loads(created_at DESC);

-- ============================================================
-- 4. Missing indexes on other tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_drivers_carrier_id ON drivers(carrier_id);
CREATE INDEX IF NOT EXISTS idx_trucks_carrier_id ON trucks(carrier_id);
CREATE INDEX IF NOT EXISTS idx_sales_broker_id ON sales(broker_id);
CREATE INDEX IF NOT EXISTS idx_sales_employee_id ON sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_details_load_id ON sales_details(load_id);
CREATE INDEX IF NOT EXISTS idx_sales_details_sales_id ON sales_details(sales_id);
CREATE INDEX IF NOT EXISTS idx_load_documents_load_id ON load_documents(load_id);
CREATE INDEX IF NOT EXISTS idx_load_status_history_load_id ON load_status_history(load_id);
CREATE INDEX IF NOT EXISTS idx_load_status_history_changed_by ON load_status_history(changed_by);
