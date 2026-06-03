-- ============================================================
-- MIGRATION v2: GPS Tracking + Locations + Driver Checkpoints
-- Fecha: 2026-06-03
-- Descripción: Agrega soporte para tracking en tiempo real
-- Idempotente: usa IF NOT EXISTS en todas las operaciones
-- ============================================================

-- 1. TABLA: locations (geocoded with Mapbox)
CREATE TABLE IF NOT EXISTS locations (
    location_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    formatted_address TEXT NOT NULL,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    lat NUMERIC(10,8),
    lng NUMERIC(11,8),
    mapbox_place_id TEXT UNIQUE,
    source TEXT DEFAULT 'mapbox',
    status_id INTEGER REFERENCES record_status(status_id) DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE locations IS 'Almacena coordenadas geocodificadas desde Mapbox. Usadas en routes, driver_checkpoints, y waypoints.';
COMMENT ON COLUMN locations.mapbox_place_id IS 'ID único de Mapbox para deduplicación y caché.';

-- 2. ALTERAR: routes - agregar location + waypoints support
ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS origin_location_id INTEGER REFERENCES locations(location_id),
    ADD COLUMN IF NOT EXISTS destination_location_id INTEGER REFERENCES locations(location_id),
    ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN routes.waypoints IS 'JSON array: [{sequence: 1, location_id: 123, type: "pickup"|"delivery", address: "..."}]';

-- 3. TABLA: driver_checkpoints (GPS real-time tracking)
CREATE TABLE IF NOT EXISTS driver_checkpoints (
    checkpoint_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_id INTEGER NOT NULL REFERENCES loads(load_id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(driver_id) ON DELETE SET NULL,
    lat NUMERIC(10,8) NOT NULL,
    lng NUMERIC(11,8) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    status_at_checkpoint VARCHAR(50),
    notes TEXT,
    created_by INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL
);

COMMENT ON TABLE driver_checkpoints IS 'Historial de posiciones GPS de conductores enviadas en tiempo real. Usado por tracking-map.tsx';
COMMENT ON COLUMN driver_checkpoints.recorded_at IS 'Timestamp cuando se registró este checkpoint.';

-- 4. ÍNDICES - Performance
CREATE INDEX IF NOT EXISTS idx_driver_checkpoints_load_id 
    ON driver_checkpoints(load_id);

CREATE INDEX IF NOT EXISTS idx_driver_checkpoints_recorded_at 
    ON driver_checkpoints(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_locations_mapbox_place_id 
    ON locations(mapbox_place_id);

-- 5. RLS POLICIES
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_checkpoints ENABLE ROW LEVEL SECURITY;

-- Locations: autenticados pueden leer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read tracking locations' AND tablename = 'locations') THEN
    CREATE POLICY "Read tracking locations" ON locations FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Write tracking locations' AND tablename = 'locations') THEN
    CREATE POLICY "Write tracking locations" ON locations FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END;
$$;

-- Driver Checkpoints: autenticados pueden CRUD
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read driver checkpoints' AND tablename = 'driver_checkpoints') THEN
    CREATE POLICY "Read driver checkpoints" ON driver_checkpoints FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Insert driver checkpoints' AND tablename = 'driver_checkpoints') THEN
    CREATE POLICY "Insert driver checkpoints" ON driver_checkpoints FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Update driver checkpoints' AND tablename = 'driver_checkpoints') THEN
    CREATE POLICY "Update driver checkpoints" ON driver_checkpoints FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END;
$$;

-- 6. SYNC SEQUENCES
SELECT setval(pg_get_serial_sequence('locations', 'location_id'), 
    coalesce(max(location_id), 1)) FROM locations;

SELECT setval(pg_get_serial_sequence('driver_checkpoints', 'checkpoint_id'), 
    coalesce(max(checkpoint_id), 1)) FROM driver_checkpoints;

-- ============================================================
-- VERIFICACIÓN POST-MIGRATION
-- ============================================================
-- Ejecutar estos queries para verificar:
-- SELECT * FROM information_schema.tables WHERE table_name IN ('locations', 'driver_checkpoints');
-- SELECT * FROM pg_indexes WHERE schemaname='public' AND tablename IN ('locations', 'driver_checkpoints');
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('locations', 'driver_checkpoints');
