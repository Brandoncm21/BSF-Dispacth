-- ============================================================
-- MIGRACIÓN: Endurecimiento de Políticas RLS (2026-06-03)
-- Objetivo: Prevenir acceso indiscriminado por cualquier usuario autenticado
-- ============================================================
-- Reglas de negocio:
--   carriers, brokers: Shared Resources (SELECT all, INSERT admin+dispatcher, UPDATE/DELETE admin)
--   loads: admin ALL, dispatcher own, soporte read-only
--   earnings: admin+back_office read-all, sales+dispatcher own
--   drivers, trucks, routes: SELECT all, ALL admin+dispatcher
--   tablas maestras: SELECT all authenticated, ALL admin
-- ============================================================

-- ============================================================
-- 1. LIMPIEZA IDEMPOTENTE
-- ============================================================

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
DROP POLICY IF EXISTS "Allow authenticated access" ON earnings;
DROP POLICY IF EXISTS "Allow authenticated access" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated access" ON notification_preferences;

DROP POLICY IF EXISTS "authenticated_can_insert_checkpoints" ON driver_checkpoints;
DROP POLICY IF EXISTS "authenticated_can_select_checkpoints" ON driver_checkpoints;
DROP POLICY IF EXISTS "Read locations" ON locations;
DROP POLICY IF EXISTS "Write locations" ON locations;
DROP POLICY IF EXISTS "Read earnings" ON earnings;
DROP POLICY IF EXISTS "Insert earnings" ON earnings;
DROP POLICY IF EXISTS "Update earnings" ON earnings;

DROP POLICY IF EXISTS "employees_select" ON employees;
DROP POLICY IF EXISTS "Read catalog tables" ON brokers;
DROP POLICY IF EXISTS "Write brokers" ON brokers;
DROP POLICY IF EXISTS "Read people tables" ON carriers;
DROP POLICY IF EXISTS "Write people tables" ON carriers;
DROP POLICY IF EXISTS "Read people tables" ON drivers;
DROP POLICY IF EXISTS "Write people tables" ON drivers;
DROP POLICY IF EXISTS "Read people tables" ON employees;
DROP POLICY IF EXISTS "Read operations" ON trucks;
DROP POLICY IF EXISTS "Read operations" ON routes;
DROP POLICY IF EXISTS "Read loads" ON loads;
DROP POLICY IF EXISTS "Write loads" ON loads;
DROP POLICY IF EXISTS "Read sales" ON sales;
DROP POLICY IF EXISTS "Write sales" ON sales;
DROP POLICY IF EXISTS "Read sales details" ON sales_details;
DROP POLICY IF EXISTS "Write sales details" ON sales_details;
DROP POLICY IF EXISTS "Read billing" ON billing;
DROP POLICY IF EXISTS "Write billing" ON billing;
DROP POLICY IF EXISTS "Read load documents" ON load_documents;
DROP POLICY IF EXISTS "Write load documents" ON load_documents;
DROP POLICY IF EXISTS "Read status history" ON load_status_history;
DROP POLICY IF EXISTS "Write status history" ON load_status_history;
DROP POLICY IF EXISTS "Insert catalog tables" ON addresses;
DROP POLICY IF EXISTS "Insert catalog tables" ON cargo_types;
DROP POLICY IF EXISTS "Insert catalog tables" ON cities;
DROP POLICY IF EXISTS "Insert catalog tables" ON routes;
DROP POLICY IF EXISTS "Insert catalog tables" ON special_requirements;
DROP POLICY IF EXISTS "Insert catalog tables" ON streets;
DROP POLICY IF EXISTS "Insert catalog tables" ON trucks;

DROP POLICY IF EXISTS "employees_insert" ON employees;
DROP POLICY IF EXISTS "employees_update" ON employees;
DROP POLICY IF EXISTS "employees_delete" ON employees;
DROP POLICY IF EXISTS "roles_select" ON roles;
DROP POLICY IF EXISTS "roles_insert" ON roles;
DROP POLICY IF EXISTS "roles_update" ON roles;
DROP POLICY IF EXISTS "roles_delete" ON roles;

DROP POLICY IF EXISTS "recipient_can_select_notifications" ON notifications;
DROP POLICY IF EXISTS "recipient_can_update_notifications" ON notifications;
DROP POLICY IF EXISTS "user_can_select_preferences" ON notification_preferences;
DROP POLICY IF EXISTS "user_can_insert_preferences" ON notification_preferences;
DROP POLICY IF EXISTS "user_can_update_preferences" ON notification_preferences;


-- ============================================================
-- 2. HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT employee_id
  FROM employees
  WHERE auth_user_id = auth.uid()
  AND status_id = 1;
$$;


-- ============================================================
-- 3. employees
-- ============================================================

CREATE POLICY "employees_select" ON employees
  FOR SELECT
  USING (
    get_user_role_type() = 'admin'
    OR auth_user_id = auth.uid()
  );

CREATE POLICY "employees_insert" ON employees
  FOR INSERT
  WITH CHECK (get_user_role_type() = 'admin');

CREATE POLICY "employees_update" ON employees
  FOR UPDATE
  USING (get_user_role_type() = 'admin');

CREATE POLICY "employees_delete" ON employees
  FOR DELETE
  USING (get_user_role_type() = 'admin');


-- ============================================================
-- 4. roles
-- ============================================================

CREATE POLICY "roles_select" ON roles FOR SELECT USING (true);
CREATE POLICY "roles_insert" ON roles FOR INSERT WITH CHECK (get_user_role_type() = 'admin');
CREATE POLICY "roles_update" ON roles FOR UPDATE USING (get_user_role_type() = 'admin');
CREATE POLICY "roles_delete" ON roles FOR DELETE USING (get_user_role_type() = 'admin');


-- ============================================================
-- 5. loads
-- ============================================================

CREATE POLICY "loads_admin_all" ON loads
  FOR ALL
  USING (get_user_role_type() = 'admin');

CREATE POLICY "loads_dispatcher_rw" ON loads
  FOR SELECT, UPDATE, INSERT
  USING (
    get_user_role_type() = 'dispatcher'
    AND dispatcher_id = get_current_employee_id()
  );

CREATE POLICY "loads_support_read" ON loads
  FOR SELECT
  USING (get_user_role_type() IN ('back_office', 'sales', 'logistics'));


-- ============================================================
-- 6. earnings
-- ============================================================

CREATE POLICY "earnings_admin_bo_read" ON earnings
  FOR SELECT
  USING (get_user_role_type() IN ('admin', 'back_office'));

CREATE POLICY "earnings_sales_own" ON earnings
  FOR SELECT
  USING (
    get_user_role_type() = 'sales'
    AND employee_id = get_current_employee_id()
  );

CREATE POLICY "earnings_dispatcher_own" ON earnings
  FOR SELECT
  USING (
    get_user_role_type() = 'dispatcher'
    AND employee_id = get_current_employee_id()
  );


-- ============================================================
-- 7. carriers (Recursos Compartidos)
-- ============================================================

CREATE POLICY "carriers_read_all" ON carriers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "carriers_write_create" ON carriers
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_user_role_type() IN ('dispatcher', 'admin')
  );

CREATE POLICY "carriers_admin_update_delete" ON carriers
  FOR UPDATE, DELETE
  USING (get_user_role_type() = 'admin');


-- ============================================================
-- 8. brokers (Recursos Compartidos)
-- ============================================================

CREATE POLICY "brokers_read_all" ON brokers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "brokers_write_create" ON brokers
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_user_role_type() IN ('dispatcher', 'admin')
  );

CREATE POLICY "brokers_admin_update_delete" ON brokers
  FOR UPDATE, DELETE
  USING (get_user_role_type() = 'admin');


-- ============================================================
-- 9. drivers
-- ============================================================
-- SELECT all authenticated; ALL for admin + dispatcher

CREATE POLICY "drivers_select_all" ON drivers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "drivers_all_ops" ON drivers
  FOR ALL
  USING (get_user_role_type() IN ('admin', 'dispatcher'));


-- ============================================================
-- 10. trucks
-- ============================================================

CREATE POLICY "trucks_select_all" ON trucks
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "trucks_all_ops" ON trucks
  FOR ALL
  USING (get_user_role_type() IN ('admin', 'dispatcher'));


-- ============================================================
-- 11. routes
-- ============================================================

CREATE POLICY "routes_select_all" ON routes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "routes_all_ops" ON routes
  FOR ALL
  USING (get_user_role_type() IN ('admin', 'dispatcher'));


-- ============================================================
-- 12. Catálogos Maestros
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  catalog_tables TEXT[] := ARRAY[
    'record_status', 'license_types', 'cargo_types', 'special_requirements',
    'states', 'cities', 'streets', 'addresses'
  ];
BEGIN
  FOREACH tbl IN ARRAY catalog_tables LOOP
    EXECUTE format(
      'CREATE POLICY "%I_select_all" ON %I FOR SELECT USING (auth.role() = ''authenticated'');',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%I_write_admin" ON %I FOR ALL USING (get_user_role_type() = ''admin'');',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================
-- 13. load_status_history
-- ============================================================

CREATE POLICY "load_status_history_rw" ON load_status_history
  FOR SELECT, INSERT
  USING (
    EXISTS (
      SELECT 1 FROM loads
      WHERE loads.load_id = load_status_history.load_id
      AND (
        loads.dispatcher_id = get_current_employee_id()
        OR get_user_role_type() IN ('admin', 'back_office', 'sales', 'logistics')
      )
    )
  );


-- ============================================================
-- 14. load_documents
-- ============================================================

CREATE POLICY "load_documents_rw" ON load_documents
  FOR SELECT, INSERT, DELETE
  USING (
    EXISTS (
      SELECT 1 FROM loads
      WHERE loads.load_id = load_documents.load_id
      AND (
        loads.dispatcher_id = get_current_employee_id()
        OR get_user_role_type() IN ('admin', 'back_office', 'sales', 'logistics')
      )
    )
  );


-- ============================================================
-- 15. locations / driver_checkpoints
-- ============================================================

CREATE POLICY "locations_read" ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM loads
      WHERE loads.load_id = locations.load_id
      AND (
        loads.dispatcher_id = get_current_employee_id()
        OR get_user_role_type() IN ('admin', 'back_office', 'logistics')
      )
    )
  );

CREATE POLICY "driver_checkpoints_rw" ON driver_checkpoints
  FOR SELECT, INSERT
  USING (
    EXISTS (
      SELECT 1 FROM loads
      WHERE loads.load_id = driver_checkpoints.load_id
      AND (
        loads.dispatcher_id = get_current_employee_id()
        OR get_user_role_type() IN ('admin', 'back_office', 'logistics')
      )
    )
  );


-- ============================================================
-- 16. sales, sales_details, billing
-- ============================================================

CREATE POLICY "sales_admin_all" ON sales FOR ALL USING (get_user_role_type() = 'admin');
CREATE POLICY "sales_details_admin_all" ON sales_details FOR ALL USING (get_user_role_type() = 'admin');
CREATE POLICY "billing_admin_all" ON billing FOR ALL USING (get_user_role_type() = 'admin');


-- ============================================================
-- 17. notifications
-- ============================================================

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT
  USING (recipient_id = get_current_employee_id());

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE
  USING (recipient_id = get_current_employee_id());

CREATE POLICY "notification_preferences_select" ON notification_preferences
  FOR SELECT
  USING (user_id = get_current_employee_id());

CREATE POLICY "notification_preferences_insert" ON notification_preferences
  FOR INSERT
  WITH CHECK (user_id = get_current_employee_id());

CREATE POLICY "notification_preferences_update" ON notification_preferences
  FOR UPDATE
  USING (user_id = get_current_employee_id());
