-- ============================================================
-- MIGRATION v4: Estados Cancelada y Retrasada
-- Fecha: 2026-06-03
-- Descripción: Agrega estados 'cancelled' y 'delayed' a loads,
--   'reversed' a earnings earnings_status, y trigger para
--   delayed → cancelled (reversa earnings + audit log)
-- Idempotente: usa IF NOT EXISTS / DO $$ blocks
-- ============================================================

-- 0. Limpiar datos legacy: 'in_transit' -> 'picked_up'
UPDATE loads SET load_status = 'picked_up' WHERE load_status = 'in_transit';
-- 1. Ampliar CHECK constraint en loads.load_status
DO $$
BEGIN
    -- PostgreSQL no permite ALTER TABLE directo en CHECK constraints;
    -- renombramos y recreamos si la restricción ya existe
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
$$;

-- 2. Ampliar CHECK constraint en earnings.earnings_status
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'earnings_earnings_status_check'
        AND table_name = 'earnings'
    ) THEN
        ALTER TABLE earnings DROP CONSTRAINT earnings_earnings_status_check;
    END IF;
    ALTER TABLE earnings ADD CONSTRAINT earnings_earnings_status_check
        CHECK (earnings_status IN ('provisional', 'confirmed', 'finalized', 'reversed'));
END;
$$;

-- 3. Agregar CHECK constraint en load_status_history (consistencia)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'load_status_history_new_status_check'
        AND table_name = 'load_status_history'
    ) THEN
        ALTER TABLE load_status_history ADD CONSTRAINT load_status_history_new_status_check
            CHECK (new_status IN ('pending','booked','picked_up','delivered','paid','cancelled','delayed'));
    END IF;
END;
$$;

-- 4. Trigger: delayed → cancelled reversa earnings + audit log
CREATE OR REPLACE FUNCTION handle_load_delayed_cancelled()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.load_status = 'cancelled' AND OLD.load_status = 'delayed' THEN
        -- Reversar earnings existentes para esta carga
        UPDATE earnings
        SET earnings_status = 'reversed',
            earnings_amount = 0,
            updated_at = NOW()
        WHERE load_id = NEW.load_id
          AND earnings_status != 'reversed';

        -- Insertar audit log en load_status_history
        INSERT INTO load_status_history (load_id, old_status, new_status, changed_by, changed_at, notes)
        VALUES (NEW.load_id, OLD.load_status, NEW.load_status, NEW.dispatcher_id, NOW(), 'Load cancelled from delayed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delayed_cancelled ON loads;
CREATE TRIGGER trigger_delayed_cancelled
    AFTER UPDATE ON loads
    FOR EACH ROW
    EXECUTE FUNCTION handle_load_delayed_cancelled();

-- 5. Verificación post-migración
-- SELECT load_status FROM loads WHERE load_status IN ('cancelled','delayed') LIMIT 5;

