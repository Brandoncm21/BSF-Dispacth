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
-- 10. HELPER FUNCTION: Generate load number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_load_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.load_number IS NULL THEN
    NEW.load_number := 'LD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SPLIT_PART(load_number, '-', 3) AS INTEGER)) FROM loads WHERE load_number LIKE 'LD-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_load_number
  BEFORE INSERT ON loads
  FOR EACH ROW
  EXECUTE FUNCTION generate_load_number();
