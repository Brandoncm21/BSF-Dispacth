-- ============================================================
-- BestFreight - Migration Script (Supabase PostgreSQL)
-- ALTER TABLEs + New Tables + RLS Policies
-- ============================================================

-- ============================================================
-- 1. ALTER TABLE: employees (add auth + vendor fields)
-- ============================================================
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS dispatch_vendor VARCHAR(50),
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- ============================================================
-- 2. ALTER TABLE: roles (add role_type for RLS)
-- ============================================================
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS role_type VARCHAR(20) CHECK (role_type IN ('admin', 'dispatcher', 'logistics', 'sales'));

-- Update existing roles with role_type
UPDATE roles SET role_type = 'admin' WHERE role_name = 'Administrador';
UPDATE roles SET role_type = 'logistics' WHERE role_name = 'Logística';
UPDATE roles SET role_type = 'sales' WHERE role_name = 'Ventas';

-- ============================================================
-- 3. ALTER TABLE: carriers (add factoring + mc_number)
-- ============================================================
ALTER TABLE carriers
  ADD COLUMN IF NOT EXISTS factoring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mc_number VARCHAR(50);

-- Update existing carriers with mc_number from motor_carrier_id
UPDATE carriers SET mc_number = motor_carrier_id WHERE motor_carrier_id IS NOT NULL;

-- ============================================================
-- 4. ALTER TABLE: drivers (add cdl_number)
-- ============================================================
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS cdl_number VARCHAR(50);

-- ============================================================
-- 5. ALTER TABLE: loads (add dispatch fields)
-- ============================================================
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS load_number VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS rate NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispatch_fee NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS origin_address_id INTEGER REFERENCES addresses(address_id),
  ADD COLUMN IF NOT EXISTS destination_address_id INTEGER REFERENCES addresses(address_id),
  ADD COLUMN IF NOT EXISTS factoring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS load_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_status VARCHAR(20) DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- ============================================================
-- 6. NEW TABLE: load_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS load_documents (
    document_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_id INTEGER REFERENCES loads(load_id),
    document_type VARCHAR(20) CHECK (document_type IN ('BOL', 'RC', 'POD')),
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES employees(employee_id)
);

-- ============================================================
-- 7. NEW TABLE: load_status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS load_status_history (
    history_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_id INTEGER REFERENCES loads(load_id),
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INTEGER REFERENCES employees(employee_id),
    changed_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE record_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_checkpoints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated access" ON record_status;
DROP POLICY IF EXISTS "Allow authenticated access" ON roles;
DROP POLICY IF EXISTS "Allow authenticated access" ON license_types;
DROP POLICY IF EXISTS "Allow authenticated access" ON cargo_types;
DROP POLICY IF EXISTS "Allow authenticated access" ON special_requirements;
DROP POLICY IF EXISTS "Allow authenticated access" ON states;
DROP POLICY IF EXISTS "Allow authenticated access" ON cities;
DROP POLICY IF EXISTS "Allow authenticated access" ON streets;
DROP POLICY IF EXISTS "Allow authenticated access" ON addresses;
DROP POLICY IF EXISTS "Allow authenticated access" ON brokers;
DROP POLICY IF EXISTS "Allow authenticated access" ON employees;
DROP POLICY IF EXISTS "Allow authenticated access" ON carriers;
DROP POLICY IF EXISTS "Allow authenticated access" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated access" ON trucks;
DROP POLICY IF EXISTS "Allow authenticated access" ON routes;
DROP POLICY IF EXISTS "Allow authenticated access" ON loads;
DROP POLICY IF EXISTS "Allow authenticated access" ON sales;
DROP POLICY IF EXISTS "Allow authenticated access" ON sales_details;
DROP POLICY IF EXISTS "Allow authenticated access" ON billing;
DROP POLICY IF EXISTS "Allow authenticated access" ON load_documents;
DROP POLICY IF EXISTS "Allow authenticated access" ON load_status_history;
DROP POLICY IF EXISTS "Allow authenticated access" ON locations;
DROP POLICY IF EXISTS "Allow authenticated access" ON driver_checkpoints;

-- Catalog tables: all authenticated users can read
CREATE POLICY "Read catalog tables" ON record_status FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON license_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON cargo_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON special_requirements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON states FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON cities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON streets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON addresses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read catalog tables" ON brokers FOR SELECT USING (auth.role() = 'authenticated');

-- People tables: authenticated users can read, admins can write
CREATE POLICY "Read people tables" ON carriers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read people tables" ON drivers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read people tables" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write people tables" ON carriers FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);
CREATE POLICY "Write people tables" ON drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);

-- Operations tables: authenticated users can read
CREATE POLICY "Read operations" ON trucks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read operations" ON routes FOR SELECT USING (auth.role() = 'authenticated');

-- Loads: dispatcher sees only their loads, admin sees all
CREATE POLICY "Read loads" ON loads FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  OR
  EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.employee_id = loads.dispatcher_id)
);
CREATE POLICY "Write loads" ON loads FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  OR
  EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.employee_id = loads.dispatcher_id)
);

-- Sales: admin only
CREATE POLICY "Read sales" ON sales FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);
CREATE POLICY "Write sales" ON sales FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);

-- Sales details: admin only
CREATE POLICY "Read sales details" ON sales_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);
CREATE POLICY "Write sales details" ON sales_details FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);

-- Billing: admin only
CREATE POLICY "Read billing" ON billing FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);
CREATE POLICY "Write billing" ON billing FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);

-- Load documents: dispatcher can read/write their loads' docs, admin all
CREATE POLICY "Read load documents" ON load_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  OR
  EXISTS (SELECT 1 FROM loads l JOIN employees e ON l.dispatcher_id = e.employee_id WHERE e.auth_user_id = auth.uid() AND l.load_id = load_documents.load_id)
);
CREATE POLICY "Write load documents" ON load_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  OR
  EXISTS (SELECT 1 FROM loads l JOIN employees e ON l.dispatcher_id = e.employee_id WHERE e.auth_user_id = auth.uid() AND l.load_id = load_documents.load_id)
);

-- Load status history: all authenticated can read
CREATE POLICY "Read status history" ON load_status_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write status history" ON load_status_history FOR ALL USING (auth.role() = 'authenticated');

-- Tracking locations: all authenticated can read
CREATE POLICY "Read tracking locations" ON locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write tracking locations" ON locations FOR ALL USING (auth.role() = 'authenticated');

-- Driver checkpoints: all authenticated can CRUD (drivers, dispatchers)
CREATE POLICY "Read driver checkpoints" ON driver_checkpoints FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Insert driver checkpoints" ON driver_checkpoints FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Update driver checkpoints" ON driver_checkpoints FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 9. HELPER FUNCTION: Get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TABLE(role_type VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT r.role_type
  FROM employees e
  JOIN roles r ON e.role_id = r.role_id
  WHERE e.auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. SEQUENCE + TRIGGER: Atomic load number generation
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS loads_seq START 1;

CREATE OR REPLACE FUNCTION generate_load_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.load_number IS NULL THEN
        NEW.load_number := 'LD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('loads_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_load_number ON loads;
CREATE TRIGGER set_load_number
    BEFORE INSERT ON loads
    FOR EACH ROW EXECUTE FUNCTION generate_load_number();

-- ============================================================
-- 11. VIEW: Sales Performance Analytics
-- ============================================================
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
  COALESCE(orig_state.state_name, 'N/A') AS origin_state_name,
  COALESCE(dest_state.state_name, 'N/A') AS destination_state_name,
  l.load_number,
  l.rate,
  l.dispatch_fee,
  s.status_id
FROM sales s
LEFT JOIN brokers b ON s.broker_id = b.broker_id
LEFT JOIN employees e ON s.employee_id = e.employee_id
LEFT JOIN sales_details sd ON s.sales_id = sd.sales_id
LEFT JOIN loads l ON sd.load_id = l.load_id
LEFT JOIN addresses orig_addr ON l.origin_address_id = orig_addr.address_id
LEFT JOIN addresses dest_addr ON l.destination_address_id = dest_addr.address_id
LEFT JOIN states orig_state ON orig_addr.state_id = orig_state.state_id
LEFT JOIN states dest_state ON dest_addr.state_id = dest_state.state_id;

-- ============================================================
-- 12. SYNC SEQUENCES
-- ============================================================
SELECT setval(pg_get_serial_sequence('carriers', 'carrier_id'), coalesce(max(carrier_id), 1)) FROM carriers;
SELECT setval(pg_get_serial_sequence('trucks', 'truck_id'), coalesce(max(truck_id), 1)) FROM trucks;
SELECT setval(pg_get_serial_sequence('drivers', 'driver_id'), coalesce(max(driver_id), 1)) FROM drivers;
SELECT setval(pg_get_serial_sequence('loads', 'load_id'), coalesce(max(load_id), 1)) FROM loads;
SELECT setval(pg_get_serial_sequence('addresses', 'address_id'), coalesce(max(address_id), 1)) FROM addresses;
SELECT setval(pg_get_serial_sequence('routes', 'route_id'), coalesce(max(route_id), 1)) FROM routes;
SELECT setval(pg_get_serial_sequence('states', 'state_id'), coalesce(max(state_id), 1)) FROM states;
SELECT setval(pg_get_serial_sequence('cities', 'city_id'), coalesce(max(city_id), 1)) FROM cities;
SELECT setval(pg_get_serial_sequence('streets', 'street_id'), coalesce(max(street_id), 1)) FROM streets;
SELECT setval(pg_get_serial_sequence('brokers', 'broker_id'), coalesce(max(broker_id), 1)) FROM brokers;
SELECT setval(pg_get_serial_sequence('cargo_types', 'cargo_type_id'), coalesce(max(cargo_type_id), 1)) FROM cargo_types;
SELECT setval(pg_get_serial_sequence('special_requirements', 'special_requirements_id'), coalesce(max(special_requirements_id), 1)) FROM special_requirements;
SELECT setval(pg_get_serial_sequence('sales', 'sales_id'), coalesce(max(sales_id), 1)) FROM sales;
SELECT setval(pg_get_serial_sequence('sales_details', 'sales_details_id'), coalesce(max(sales_details_id), 1)) FROM sales_details;
SELECT setval(pg_get_serial_sequence('billing', 'invoice_id'), coalesce(max(invoice_id), 1)) FROM billing;
SELECT setval(pg_get_serial_sequence('employees', 'employee_id'), coalesce(max(employee_id), 1)) FROM employees;
SELECT setval(pg_get_serial_sequence('roles', 'role_id'), coalesce(max(role_id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('locations', 'location_id'), coalesce(max(location_id), 1)) FROM locations;
SELECT setval(pg_get_serial_sequence('driver_checkpoints', 'checkpoint_id'), coalesce(max(checkpoint_id), 1)) FROM driver_checkpoints;

-- ============================================================
-- MIGRACION v4: Estados Cancelada y Retrasada (2026-06-03)
-- ============================================================
DO $
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'loads_load_status_check'
        AND table_name = 'loads'
    ) THEN
        ALTER TABLE loads DROP CONSTRAINT loads_load_status_check;
    END IF;
    ALTER TABLE loads ADD CONSTRAINT loads_load_status_check
        CHECK (load_status IN ('pending','booked','picked_up','delivered','paid','cancelled','delayed'));
END;
$;
