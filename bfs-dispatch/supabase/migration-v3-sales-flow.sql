-- ============================================================
-- MIGRATION v3: Sales Auto-Creation on Load Booking
-- Fecha: 2026-06-03
-- Descripción: Trigger único en loads que crea sales + 
--   sales_details + earnings cuando load_status → 'booked'
-- Idempotente: usa IF NOT EXISTS / DO $$ blocks
-- ============================================================

-- 1. Agregar broker_id a loads (NULLABLE, editable luego en UI de ventas)
ALTER TABLE loads
    ADD COLUMN IF NOT EXISTS broker_id INTEGER REFERENCES brokers(broker_id);

-- 2. Tabla earnings: tracking de profit por dispatcher
CREATE TABLE IF NOT EXISTS earnings (
    earnings_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    load_id INTEGER NOT NULL REFERENCES loads(load_id),
    sales_id INTEGER REFERENCES sales(sales_id),
    sale_date DATE NOT NULL,
    earnings_amount NUMERIC(12,2) NOT NULL,
    profit_type VARCHAR(20) DEFAULT 'dispatch_fee'
        CHECK (profit_type IN ('dispatch_fee', 'delivery_complete', 'payment_received')),
    earnings_status VARCHAR(20) DEFAULT 'provisional'
        CHECK (earnings_status IN ('provisional', 'confirmed', 'finalized')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES employees(employee_id),
    status_id INTEGER DEFAULT 1 REFERENCES record_status(status_id)
);

COMMENT ON TABLE earnings IS 'Registro de ganancias por dispatcher por carga. Creado automáticamente por trigger cuando load → booked.';
COMMENT ON COLUMN earnings.profit_type IS 'Tipo de profit: dispatch_fee, delivery_complete, payment_received';
COMMENT ON COLUMN earnings.earnings_status IS 'Estado: provisional (al booking), confirmed (al delivery), finalized (al payment)';

CREATE INDEX IF NOT EXISTS idx_earnings_employee_id ON earnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_earnings_load_id ON earnings(load_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings(earnings_status);

-- 3. Trigger único: AFTER UPDATE ON loads
CREATE OR REPLACE FUNCTION create_sale_on_load_booked()
RETURNS TRIGGER AS $$
DECLARE
    v_sales_id INTEGER;
    v_profit NUMERIC;
    v_rate NUMERIC;
    v_dispatch_fee NUMERIC;
BEGIN
    IF NEW.load_status = 'booked' AND OLD.load_status != 'booked' THEN
        
        v_rate := COALESCE(NEW.rate, 0);
        v_dispatch_fee := COALESCE(
            NEW.dispatch_fee,
            COALESCE(NEW.dispatch_fee_pct, 0) * v_rate / 100,
            0
        );
        v_profit := v_rate - v_dispatch_fee;
        
        -- 3a. Crear sales
        INSERT INTO sales (
            total_amount,
            total_cost,
            profit_pct,
            total_profit,
            sale_date,
            broker_id,
            employee_id,
            status_id
        ) VALUES (
            v_rate,
            v_dispatch_fee,
            CASE WHEN v_rate > 0 THEN ROUND((v_profit / v_rate * 100)::NUMERIC, 2) ELSE 0 END,
            v_profit,
            NOW()::DATE,
            NEW.broker_id,
            NEW.dispatcher_id,
            1
        ) RETURNING sales_id INTO v_sales_id;
        
        -- 3b. Crear sales_details
        INSERT INTO sales_details (
            sales_id,
            load_id,
            quantity,
            unit_price,
            total_amount,
            shipment_status,
            status_id
        ) VALUES (
            v_sales_id,
            NEW.load_id,
            1,
            v_rate,
            v_rate,
            'booked',
            1
        );
        
        -- 3c. Crear earnings (si hay dispatcher asignado)
        IF NEW.dispatcher_id IS NOT NULL THEN
            INSERT INTO earnings (
                employee_id,
                load_id,
                sales_id,
                sale_date,
                earnings_amount,
                profit_type,
                earnings_status,
                created_by
            ) VALUES (
                NEW.dispatcher_id,
                NEW.load_id,
                v_sales_id,
                NOW()::DATE,
                v_profit,
                'dispatch_fee',
                'provisional',
                NEW.dispatcher_id
            );
        END IF;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sales_on_load_booked ON loads;
CREATE TRIGGER trigger_sales_on_load_booked
    AFTER UPDATE ON loads
    FOR EACH ROW
    EXECUTE FUNCTION create_sale_on_load_booked();

-- 4. RLS policies para earnings
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read earnings' AND tablename = 'earnings') THEN
        CREATE POLICY "Read earnings" ON earnings
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Insert earnings' AND tablename = 'earnings') THEN
        CREATE POLICY "Insert earnings" ON earnings
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Update earnings' AND tablename = 'earnings') THEN
        CREATE POLICY "Update earnings" ON earnings
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END;
$$;

-- 5. Sync sequence
SELECT setval(pg_get_serial_sequence('earnings', 'earnings_id'),
    COALESCE(MAX(earnings_id), 1)) FROM earnings;

-- ============================================================
-- VERIFICACIÓN POST-MIGRATION
-- ============================================================
-- SELECT trigger_name, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public' AND event_object_table = 'loads';
-- 
-- SELECT * FROM earnings LIMIT 5;
