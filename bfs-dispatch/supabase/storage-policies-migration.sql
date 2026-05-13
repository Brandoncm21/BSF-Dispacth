-- ============================================================
-- BestFreight - Storage bucket RLS policies
-- Replaces generic authenticated-user policies with role-scoped
-- ============================================================

-- Drop the permissive policies that existed on storage.objects for load_documents
DROP POLICY IF EXISTS "load_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "load_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "load_documents_delete" ON storage.objects;

-- SELECT: admin or dispatcher assigned to the load can read documents
CREATE POLICY "load_documents_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'load_documents'
    AND (
      EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
      OR
      EXISTS (
        SELECT 1 FROM load_documents ld
        JOIN loads l ON ld.load_id = l.load_id
        JOIN employees e ON l.dispatcher_id = e.employee_id
        WHERE e.auth_user_id = auth.uid()
        AND ld.file_path = objects.name
      )
    )
  );

-- INSERT: admin or dispatcher can upload documents
CREATE POLICY "load_documents_upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'load_documents'
    AND (
      EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
      OR
      EXISTS (SELECT 1 FROM employees e WHERE e.auth_user_id = auth.uid())
    )
  );

-- DELETE: admin only
CREATE POLICY "load_documents_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'load_documents'
    AND EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.auth_user_id = auth.uid() AND r.role_type = 'admin')
  );
