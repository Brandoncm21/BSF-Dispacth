-- ============================================================
-- MIGRATION v5: Rutas Frecuentes
-- Fecha: 2026-06-03
-- Descripcion: Agrega columna is_frequent a routes para marcar
--   rutas como frecuentes y filtrarlas en el selector de cargas
-- Idempotente: usa IF NOT EXISTS
-- ============================================================

ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS is_frequent BOOLEAN DEFAULT FALSE;

-- Verificacion:
-- SELECT is_frequent FROM routes LIMIT 5;
