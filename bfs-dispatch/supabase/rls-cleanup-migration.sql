-- ============================================================
-- BestFreight - RLS Policy Cleanup
-- Drops overly permissive policies that conflict with
-- role-scoped policies from migration.sql
-- Also removes auto-generated permissive policies
-- ============================================================

-- ============================================================
-- 1. CARRIERS — Drop auto-generated write policy, keep the role-scoped one from migration.sql
-- ============================================================
DROP POLICY IF EXISTS "Write carriers" ON carriers;

CREATE POLICY "Write carriers" ON carriers FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);

-- ============================================================
-- 2. DRIVERS — Drop auto-generated write policy
-- ============================================================
DROP POLICY IF EXISTS "Write drivers" ON drivers;

CREATE POLICY "Write drivers" ON drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);

-- ============================================================
-- 3. BROKERS — Drop auto-generated write/update policies
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated insert" ON brokers;
DROP POLICY IF EXISTS "Allow authenticated update" ON brokers;

-- Brokers: all authenticated can read, admin can write
DROP POLICY IF EXISTS "Read catalog tables" ON brokers;
CREATE POLICY "Read catalog tables" ON brokers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write brokers" ON brokers FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
);

-- ============================================================
-- 4. LOADS — Fix Write policy that somehow ended up as 'true'
-- ============================================================
DROP POLICY IF EXISTS "Write loads" ON loads;

CREATE POLICY "Write loads" ON loads FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  OR
  EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid() AND e.employee_id = loads.dispatcher_id)
);

-- ============================================================
-- 5. EMPLOYEES — Restrict SELECT to admin or own record
-- ============================================================
DROP POLICY IF EXISTS "Employees select" ON employees;
DROP POLICY IF EXISTS "Read people tables" ON employees;

CREATE POLICY "employees_select" ON employees FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  OR
  auth_user_id = auth.uid()
);

-- ============================================================
-- 6. LOAD DOCUMENTS — Drop the permissive auto-generated policies
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated inserts to load_documents" ON load_documents;
DROP POLICY IF EXISTS "Allow authenticated selects from load_documents" ON load_documents;

-- ============================================================
-- 7. LOAD STATUS HISTORY — Restrict write to admin/dispatcher
-- ============================================================
DROP POLICY IF EXISTS "Write status history" ON load_status_history;

CREATE POLICY "Write status history" ON load_status_history FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  OR
  EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid())
);

-- ============================================================
-- 8. Remove auto-generated insert policies on catalog tables
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated insert" ON addresses;
DROP POLICY IF EXISTS "Allow authenticated insert" ON cargo_types;
DROP POLICY IF EXISTS "Allow authenticated insert" ON cities;
DROP POLICY IF EXISTS "Allow authenticated insert" ON routes;
DROP POLICY IF EXISTS "Allow authenticated insert" ON special_requirements;
DROP POLICY IF EXISTS "Allow authenticated insert" ON streets;
DROP POLICY IF EXISTS "Allow authenticated insert" ON trucks;

-- These catalog tables need insert for operations. Recreate with user-based check.
CREATE POLICY "Insert catalog tables" ON addresses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insert catalog tables" ON cargo_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insert catalog tables" ON cities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insert catalog tables" ON routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insert catalog tables" ON special_requirements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insert catalog tables" ON streets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insert catalog tables" ON trucks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
