-- ============================================================
-- BestFreight - RBAC Migration
-- Role-Based Access Control: Auth trigger, enhanced RLS, HR module
-- ============================================================

-- ============================================================
-- 1. Extend role_type CHECK to include 'back_office'
-- ============================================================
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_role_type_check;
ALTER TABLE roles ADD CONSTRAINT roles_role_type_check
  CHECK (role_type IN ('admin', 'dispatcher', 'logistics', 'sales', 'back_office'));

-- Insert back_office role if it doesn't exist
INSERT INTO roles (role_name, status_id, role_type)
SELECT 'Back Office', 1, 'back_office'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_type = 'back_office');

-- ============================================================
-- 2. Auth Trigger: Auto-create employee record on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_type VARCHAR(20);
  default_role_id INTEGER;
BEGIN
  -- Get role from user_metadata, default to 'dispatcher'
  user_role_type := COALESCE(NEW.raw_user_meta_data->>'role', 'dispatcher');

  -- Find the corresponding role_id
  SELECT role_id INTO default_role_id
  FROM roles
  WHERE role_type = user_role_type
  LIMIT 1;

  -- Fallback to first available role if not found
  IF default_role_id IS NULL THEN
    SELECT role_id INTO default_role_id FROM roles LIMIT 1;
  END IF;

  INSERT INTO employees (
    first_name,
    last_name,
    role_id,
    status_id,
    auth_user_id
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuario'),
    default_role_id,
    1,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. Helper: Get user role type (SECURITY DEFINER, bypasses RLS)
-- Used by middleware and frontend hooks for role checks
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role_type()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.role_type INTO user_role
  FROM employees e
  JOIN roles r ON e.role_id = r.role_id
  WHERE e.auth_user_id = auth.uid()
  AND e.status_id = 1
  LIMIT 1;

  RETURN COALESCE(user_role, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. Enhanced RLS for employees table (HR Module)
-- ============================================================

-- Drop existing broad policies
DROP POLICY IF EXISTS "Read employees basic" ON employees;
DROP POLICY IF EXISTS "Write employees admin only" ON employees;

-- All authenticated users can read employees
CREATE POLICY "employees_select" ON employees
  FOR SELECT
  USING (true);

-- Only admins can write employees
CREATE POLICY "employees_insert" ON employees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.auth_user_id = auth.uid()
      AND r.role_type = 'admin'
    )
  );

CREATE POLICY "employees_update" ON employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.auth_user_id = auth.uid()
      AND r.role_type = 'admin'
    )
  );

CREATE POLICY "employees_delete" ON employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.auth_user_id = auth.uid()
      AND r.role_type = 'admin'
    )
  );

-- ============================================================
-- 5. RLS for roles table (admin-only write)
-- ============================================================
DROP POLICY IF EXISTS "Read roles" ON roles;
DROP POLICY IF EXISTS "Write roles admin only" ON roles;

-- All authenticated users can read roles
CREATE POLICY "roles_select" ON roles
  FOR SELECT
  USING (true);

-- Only admins can write roles
CREATE POLICY "roles_insert" ON roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.auth_user_id = auth.uid()
      AND r.role_type = 'admin'
    )
  );

CREATE POLICY "roles_update" ON roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.auth_user_id = auth.uid()
      AND r.role_type = 'admin'
    )
  );

CREATE POLICY "roles_delete" ON roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.auth_user_id = auth.uid()
      AND r.role_type = 'admin'
    )
  );

-- ============================================================
-- 6. RPC: Search employees (for HR module)
-- ============================================================
CREATE OR REPLACE FUNCTION search_employees(
  p_search TEXT DEFAULT NULL,
  p_status INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 16,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  employee_id INTEGER,
  first_name TEXT,
  last_name TEXT,
  role_id INTEGER,
  role_name TEXT,
  role_type TEXT,
  status_id INTEGER,
  status_name TEXT,
  auth_user_id UUID,
  dispatch_vendor TEXT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.employee_id,
    e.first_name::TEXT,
    e.last_name::TEXT,
    e.role_id,
    r.role_name::TEXT,
    r.role_type::TEXT,
    e.status_id,
    rs.status_name::TEXT,
    e.auth_user_id,
    e.dispatch_vendor::TEXT,
    COUNT(*) OVER() as total_count
  FROM employees e
  JOIN roles r ON e.role_id = r.role_id
  JOIN record_status rs ON e.status_id = rs.status_id
  WHERE (p_search IS NULL OR
    LOWER(e.first_name || ' ' || e.last_name) LIKE LOWER('%' || p_search || '%') OR
    LOWER(r.role_name) LIKE LOWER('%' || p_search || '%'))
  AND (p_status IS NULL OR e.status_id = p_status)
  ORDER BY e.first_name, e.last_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 7. RPC: Update employee role
-- ============================================================
CREATE OR REPLACE FUNCTION update_employee_role(
  p_employee_id INTEGER,
  p_new_role_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM employees e
    JOIN roles r ON e.role_id = r.role_id
    WHERE e.auth_user_id = auth.uid()
    AND r.role_type = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RETURN FALSE;
  END IF;

  UPDATE employees
  SET role_id = p_new_role_id
  WHERE employee_id = p_employee_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. RPC: Toggle employee status
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_employee_status(
  p_employee_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
  current_status INTEGER;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM employees e
    JOIN roles r ON e.role_id = r.role_id
    WHERE e.auth_user_id = auth.uid()
    AND r.role_type = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RETURN FALSE;
  END IF;

  SELECT status_id INTO current_status
  FROM employees
  WHERE employee_id = p_employee_id;

  IF current_status = 1 THEN
    UPDATE employees SET status_id = 2 WHERE employee_id = p_employee_id;
  ELSE
    UPDATE employees SET status_id = 1 WHERE employee_id = p_employee_id;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
