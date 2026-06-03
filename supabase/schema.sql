-- ============================================================
-- BestFreight - Supabase Schema (PostgreSQL)
-- Migrado desde Oracle (BF_ version)
-- ============================================================

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CATÁLOGOS / CONFIGURACIÓN
-- ============================================================

CREATE TABLE record_status (
    status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_name VARCHAR(255) NOT NULL
);

CREATE TABLE roles (
    role_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL,
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE license_types (
    license_type_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    license_type_name VARCHAR(255) NOT NULL,
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE cargo_types (
    cargo_type_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cargo_type_name VARCHAR(255) NOT NULL,
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE special_requirements (
    special_requirements_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requirement_description VARCHAR(255),
    status_id INTEGER REFERENCES record_status(status_id)
);

-- ============================================================
-- GEOGRAFÍA
-- ============================================================

CREATE TABLE states (
    state_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    state_name VARCHAR(255) NOT NULL,
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE cities (
    city_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_name VARCHAR(255) NOT NULL,
    state_id INTEGER REFERENCES states(state_id)
);

CREATE TABLE streets (
    street_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    street_name VARCHAR(255) NOT NULL,
    city_id INTEGER REFERENCES cities(city_id),
    state_id INTEGER REFERENCES states(state_id)
);

CREATE TABLE addresses (
    address_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    street_id INTEGER REFERENCES streets(street_id),
    address_description VARCHAR(255),
    state_id INTEGER REFERENCES states(state_id)
);

-- ============================================================
-- PERSONAS
-- ============================================================

CREATE TABLE brokers (
    broker_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE employees (
    employee_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(role_id),
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE carriers (
    carrier_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone_number VARCHAR(50),
    email VARCHAR(255),
    motor_carrier_id VARCHAR(50),
    us_department_of_transportation_number VARCHAR(50),
    employer_identification_number VARCHAR(50),
    social_security_number VARCHAR(50),
    factoring BOOLEAN DEFAULT FALSE,
    status_id INTEGER REFERENCES record_status(status_id),
    mc_number VARCHAR(50),
    dot_number VARCHAR(50),
    dispatch_fee_percent NUMERIC(5,4) DEFAULT 0.05
);

CREATE TABLE drivers (
    driver_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    license_type VARCHAR(50),
    carrier_id INTEGER REFERENCES carriers(carrier_id),
    status_id INTEGER REFERENCES record_status(status_id)
);

-- ============================================================
-- OPERACIONES
-- ============================================================

CREATE TABLE trucks (
    truck_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    unit_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(255),
    capacity NUMERIC,
    operational_status VARCHAR(255),
    carrier_id INTEGER REFERENCES carriers(carrier_id),
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE routes (
    route_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    origin_address_id INTEGER REFERENCES addresses(address_id),
    destination_address_id INTEGER REFERENCES addresses(address_id),
    estimated_time VARCHAR(255),
    miles NUMERIC,
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE loads (
    load_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_number VARCHAR(20) UNIQUE,
    load_data VARCHAR(500),
    load_weight NUMERIC(10,2),
    rate NUMERIC(12,2) DEFAULT 0,
    dispatch_fee NUMERIC(12,2) DEFAULT 0,
    dispatch_fee_pct NUMERIC(5,2),
    factoring BOOLEAN DEFAULT FALSE,
    load_status VARCHAR(20) DEFAULT 'pending'
        CHECK (load_status IN ('pending','booked','picked_up','delivered','paid','cancelled','delayed')),
    paid_status VARCHAR(20) DEFAULT 'unpaid'
        CHECK (paid_status IN ('unpaid','partial','paid')),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    booked_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    carrier_id INTEGER REFERENCES carriers(carrier_id),
    truck_id INTEGER REFERENCES trucks(truck_id),
    driver_id INTEGER REFERENCES drivers(driver_id),
    route_id INTEGER REFERENCES routes(route_id),
    origin_address_id INTEGER REFERENCES addresses(address_id),
    destination_address_id INTEGER REFERENCES addresses(address_id),
    dispatcher_id INTEGER REFERENCES employees(employee_id),
    status_id INTEGER REFERENCES record_status(status_id) DEFAULT 1,
    cargo_type_id INTEGER REFERENCES cargo_types(cargo_type_id),
    special_requirements_id INTEGER REFERENCES special_requirements(special_requirements_id)
);

CREATE TABLE sales (
    sales_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    total_amount NUMERIC,
    total_cost NUMERIC,
    profit_pct NUMERIC,
    total_profit NUMERIC,
    sale_date DATE,
    broker_id INTEGER REFERENCES brokers(broker_id),
    employee_id INTEGER REFERENCES employees(employee_id),
    status_id INTEGER REFERENCES record_status(status_id)
);

CREATE TABLE sales_details (
    sales_details_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    total NUMERIC,
    load_id INTEGER REFERENCES loads(load_id),
    sales_id INTEGER REFERENCES sales(sales_id),
    status_id INTEGER REFERENCES record_status(status_id),
    quantity NUMERIC,
    unit_price NUMERIC,
    total_amount NUMERIC,
    discount NUMERIC,
    tax_amount NUMERIC,
    shipment_status VARCHAR(50)
);

CREATE TABLE billing (
    invoice_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_number VARCHAR(255) NOT NULL,
    issue_date DATE,
    total_amount NUMERIC,
    taxes NUMERIC,
    sales_id INTEGER REFERENCES sales(sales_id),
    status_id INTEGER REFERENCES record_status(status_id),
    billing_details_id INTEGER REFERENCES sales_details(sales_details_id)
);

-- ============================================================
-- DATOS INICIALES (Seed)
-- ============================================================

INSERT INTO record_status (status_name) VALUES
    ('Activo'),
    ('Inactivo'),
    ('Pendiente');

INSERT INTO roles (role_name, status_id) VALUES
    ('Administrador', 1),
    ('Logística', 1),
    ('Ventas', 1);

INSERT INTO states (state_name, status_id) VALUES
    ('San José', 1),
    ('Cartago', 1),
    ('Alajuela', 1);

INSERT INTO cities (city_name, state_id) VALUES
    ('Coronado', 1),
    ('Oreamuno', 2),
    ('Grecia', 3);

INSERT INTO streets (street_name, city_id, state_id) VALUES
    ('Calle 1', 1, 1),
    ('Calle 2', 2, 2),
    ('Calle 3', 3, 3);

INSERT INTO addresses (street_id, address_description, state_id) VALUES
    (1, 'Frente al parque central', 1),
    (2, 'Detrás de la iglesia', 2),
    (3, 'Contiguo al supermercado', 3);

INSERT INTO routes (origin_address_id, destination_address_id, estimated_time, miles, status_id) VALUES
    (1, 2, '30 minutos', 25, 1),
    (2, 3, '1 hora', 45, 1),
    (3, 1, '20 minutos', 15, 1);

INSERT INTO license_types (license_type_name, status_id) VALUES
    ('Tipo B1', 1),
    ('Tipo D3', 1),
    ('Tipo E', 1);

INSERT INTO cargo_types (cargo_type_name, status_id) VALUES
    ('Alimentos', 1),
    ('Electrónica', 1),
    ('Material de construcción', 1);

INSERT INTO special_requirements (requirement_description, status_id) VALUES
    ('Refrigeración', 1),
    ('Carga frágil', 1),
    ('Maniobra pesada', 1);

INSERT INTO brokers (first_name, last_name, email, phone_number, status_id) VALUES
    ('Laura', 'González', 'laura@example.com', '8888-1111', 1),
    ('Mario', 'Soto', 'mario@example.com', '8888-2222', 1),
    ('Ana', 'Ramírez', 'ana@example.com', '8888-3333', 1);

INSERT INTO employees (first_name, last_name, role_id, status_id) VALUES
    ('Carlos', 'Jiménez', 1, 1),
    ('Diana', 'Solano', 2, 1),
    ('Luis', 'Vargas', 3, 1);

INSERT INTO carriers (company_name, owner_name, first_name, last_name, address, phone_number, email, motor_carrier_id, us_department_of_transportation_number, employer_identification_number, social_security_number, status_id, mc_number, dispatch_fee_percent) VALUES
    ('Transportes Pedro Cruz', 'Pedro Cruz', 'Transportes Pedro Cruz', 'Pedro Cruz', 'Av. 10', '8888-4444', 'pedro@example.com', 'MC123', 'DOT456', 'XX-XXXXXXX', '***-**-****', 1, 'MC-123456', 0.05),
    ('Lucía Valverde Logistics', 'Lucía Valverde', 'Lucía Valverde Logistics', 'Lucía Valverde', 'Calle 8', '8888-5555', 'lucia@example.com', 'MC124', 'DOT457', 'XX-XXXXXXX', '***-**-****', 1, 'MC-124579', 0.06),
    ('Marco Salas Transport', 'Marco Salas', 'Marco Salas Transport', 'Marco Salas', 'Ruta 32', '8888-6666', 'marco@example.com', 'MC125', 'DOT458', 'XX-XXXXXXX', '***-**-****', 1, 'MC-125841', 0.05);

INSERT INTO trucks (unit_number, vehicle_type, capacity, operational_status, carrier_id, status_id) VALUES
    ('U001', 'Camión', 10, 'Activo', 1, 1),
    ('U002', 'Camión', 15, 'Activo', 2, 1),
    ('U003', 'Furgón', 20, 'En mantenimiento', 3, 1);

INSERT INTO drivers (first_name, last_name, phone_number, license_type, carrier_id, status_id) VALUES
    ('Rafael', 'Campos', '8888-7777', 'Tipo B1', 1, 1),
    ('Sofía', 'Chaves', '8888-8888', 'Tipo D3', 2, 1),
    ('Diego', 'Mora', '8888-9999', 'Tipo E', 3, 1);

INSERT INTO loads (load_data, load_weight, rate, dispatch_fee, factoring, load_status, paid_status, carrier_id, truck_id, driver_id, dispatcher_id, route_id, status_id, cargo_type_id, special_requirements_id) VALUES
    ('Carga alimentos', 5000, 1000, 200, FALSE, 'delivered', 'paid', 1, 1, 1, 1, 1, 1, 1, 1),
    ('Carga electrónica', 3000, 1500, 300, FALSE, 'delivered', 'paid', 2, 2, 2, 2, 2, 1, 2, 2),
    ('Carga pesada', 8000, 2000, 400, FALSE, 'delivered', 'paid', 3, 3, 3, 3, 3, 1, 3, 3);

INSERT INTO sales (total_amount, total_cost, profit_pct, total_profit, sale_date, broker_id, employee_id, status_id) VALUES
    (10000, 7000, 30, 3000, '2025-07-01', 1, 1, 1),
    (15000, 11000, 26.6, 4000, '2025-07-10', 2, 2, 1),
    (8000, 5000, 37.5, 3000, '2025-07-12', 3, 3, 1);

INSERT INTO sales_details (total, load_id, sales_id, status_id, quantity, unit_price, total_amount, discount, tax_amount, shipment_status) VALUES
    (1, NULL, 1, 1, 2, 3000, 6000, 0, 300, 'Entregado'),
    (1, NULL, 2, 1, 3, 3000, 9000, 100, 500, 'En tránsito'),
    (1, NULL, 3, 1, 1, 2000, 2000, 0, 200, 'Pendiente');

INSERT INTO billing (invoice_number, issue_date, total_amount, taxes, sales_id, status_id, billing_details_id) VALUES
    ('FAC-001', '2025-07-01', 10000, 1300, 1, 1, 1),
    ('FAC-002', '2025-07-10', 15000, 1900, 2, 1, 2),
    ('FAC-003', '2025-07-12', 8000, 1000, 3, 1, 3);

-- ============================================================
-- VISTAS (PostgreSQL)
-- ============================================================

CREATE OR REPLACE VIEW active_loads_v AS
SELECT
    l.load_id,
    l.load_data,
    l.load_weight,
    ct.cargo_type_name,
    sr.requirement_description AS special_requirement,
    s.status_name AS load_status,
    d.first_name || ' ' || d.last_name AS driver_name,
    t.unit_number AS truck_unit,
    c.first_name || ' ' || c.last_name AS carrier_name,
    e.first_name || ' ' || e.last_name AS dispatcher_name
FROM loads l
JOIN cargo_types ct ON l.cargo_type_id = ct.cargo_type_id
LEFT JOIN special_requirements sr ON l.special_requirements_id = sr.special_requirements_id
JOIN record_status s ON l.status_id = s.status_id
JOIN routes r ON l.route_id = r.route_id
JOIN drivers d ON l.driver_id = d.driver_id
JOIN trucks t ON l.truck_id = t.truck_id
JOIN carriers c ON l.carrier_id = c.carrier_id
LEFT JOIN employees e ON l.dispatcher_id = e.employee_id
WHERE s.status_name IN ('Pendiente', 'Activo');

CREATE OR REPLACE VIEW trucks_v AS
SELECT
    t.truck_id,
    t.unit_number || ' (' || t.vehicle_type || ')' AS truck_name,
    t.capacity,
    t.operational_status,
    c.first_name || ' ' || c.last_name AS carrier_name,
    rs.status_name AS truck_status
FROM trucks t
JOIN carriers c ON t.carrier_id = c.carrier_id
JOIN record_status rs ON t.status_id = rs.status_id;

CREATE OR REPLACE VIEW dispatchers_v AS
SELECT
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    r.role_name,
    rs.status_name AS employee_status
FROM employees e
JOIN roles r ON e.role_id = r.role_id
JOIN record_status rs ON e.status_id = rs.status_id;

CREATE OR REPLACE VIEW routes_v AS
SELECT
    r.route_id,
    a1.address_description AS origin_address,
    a2.address_description AS destination_address,
    r.estimated_time,
    r.miles,
    rs.status_name
FROM routes r
JOIN addresses a1 ON r.origin_address_id = a1.address_id
JOIN addresses a2 ON r.destination_address_id = a2.address_id
JOIN record_status rs ON r.status_id = rs.status_id;

CREATE OR REPLACE VIEW brokers_v AS
SELECT
    b.broker_id,
    b.first_name || ' ' || b.last_name AS broker_name,
    b.email,
    b.phone_number,
    rs.status_name AS broker_status
FROM brokers b
JOIN record_status rs ON b.status_id = rs.status_id;

CREATE OR REPLACE VIEW carriers_v AS
SELECT
    c.carrier_id,
    c.first_name || ' ' || c.last_name AS carrier_name,
    c.address,
    c.phone_number,
    c.email,
    rs.status_name AS carrier_status
FROM carriers c
JOIN record_status rs ON c.status_id = rs.status_id;

CREATE OR REPLACE VIEW loads_v AS
SELECT
    l.load_id,
    l.load_data,
    l.load_weight,
    c.carrier_id,
    t.truck_id,
    d.driver_id,
    e.employee_id AS dispatcher_id,
    r.route_id,
    rs.status_name AS load_status,
    ct.cargo_type_id
FROM loads l
JOIN carriers c ON l.carrier_id = c.carrier_id
JOIN trucks t ON l.truck_id = t.truck_id
JOIN drivers d ON l.driver_id = d.driver_id
JOIN employees e ON l.dispatcher_id = e.employee_id
JOIN routes r ON l.route_id = r.route_id
JOIN record_status rs ON l.status_id = rs.status_id
JOIN cargo_types ct ON l.cargo_type_id = ct.cargo_type_id;

CREATE OR REPLACE VIEW billing_v AS
SELECT
    b.invoice_id,
    b.invoice_number,
    b.issue_date,
    b.total_amount,
    b.taxes,
    s.sales_id,
    rs.status_name AS invoice_status
FROM billing b
JOIN sales s ON b.sales_id = s.sales_id
JOIN record_status rs ON b.status_id = rs.status_id;

CREATE OR REPLACE VIEW special_requirements_v AS
SELECT
    sr.special_requirements_id,
    sr.requirement_description,
    rs.status_name AS requirement_status
FROM special_requirements sr
JOIN record_status rs ON sr.status_id = rs.status_id;

CREATE OR REPLACE VIEW employees_v AS
SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.role_id,
    e.status_id,
    rs.status_name AS employee_status
FROM employees e
JOIN record_status rs ON e.status_id = rs.status_id;

CREATE OR REPLACE VIEW drivers_v AS
SELECT
    d.driver_id,
    d.first_name,
    d.last_name,
    d.phone_number,
    d.license_type,
    c.first_name AS carrier_first_name,
    c.last_name AS carrier_last_name,
    rs.status_name AS driver_status
FROM drivers d
JOIN carriers c ON d.carrier_id = c.carrier_id
JOIN record_status rs ON d.status_id = rs.status_id;

CREATE OR REPLACE VIEW sales_v AS
SELECT
    s.sales_id,
    s.total_amount,
    s.total_cost,
    s.profit_pct,
    s.total_profit,
    s.sale_date,
    s.broker_id,
    s.employee_id,
    s.status_id,
    rs.status_name AS sale_status
FROM sales s
JOIN record_status rs ON s.status_id = rs.status_id;

CREATE OR REPLACE VIEW sales_details_v AS
SELECT
    d.sales_details_id,
    d.sales_id,
    d.load_id,
    d.status_id,
    rs.status_name AS detail_status,
    d.quantity,
    d.unit_price,
    d.total_amount,
    d.discount,
    d.tax_amount,
    d.shipment_status
FROM sales_details d
JOIN record_status rs ON d.status_id = rs.status_id;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

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

-- Policy: Allow authenticated users full access (adjust per your needs)
CREATE POLICY "Allow authenticated access" ON record_status FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON roles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON license_types FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON cargo_types FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON special_requirements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON states FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON cities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON streets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON addresses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON brokers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON carriers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON drivers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON trucks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON routes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON loads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON sales_details FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON billing FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- MIGRACIONES POSTERIORES (mantener sincronizado con migration.sql)
-- ============================================================

-- Columnas adicionales agregadas en migraciones
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dispatch_vendor VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS role_type VARCHAR(20) CHECK (role_type IN ('admin', 'dispatcher', 'logistics', 'sales', 'back_office'));
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS factoring BOOLEAN DEFAULT FALSE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS mc_number VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cdl_number VARCHAR(50);
ALTER TABLE loads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE loads ADD COLUMN IF NOT EXISTS broker_id INTEGER REFERENCES brokers(broker_id);

ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS origin_location_id INTEGER REFERENCES locations(location_id),
    ADD COLUMN IF NOT EXISTS destination_location_id INTEGER REFERENCES locations(location_id),
    ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]'::jsonb;

-- Tablas nuevas
CREATE TABLE IF NOT EXISTS load_documents (
    document_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_id INTEGER REFERENCES loads(load_id),
    document_type VARCHAR(20) CHECK (document_type IN ('BOL', 'RC', 'POD')),
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES employees(employee_id)
);

CREATE TABLE IF NOT EXISTS load_status_history (
    history_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    load_id INTEGER REFERENCES loads(load_id),
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INTEGER REFERENCES employees(employee_id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- ============================================================
-- TABLAS DE TRACKING (sincronizadas con producción)
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_locations_mapbox_place_id ON locations(mapbox_place_id);
CREATE INDEX IF NOT EXISTS idx_driver_checkpoints_load_id ON driver_checkpoints(load_id);
CREATE INDEX IF NOT EXISTS idx_driver_checkpoints_recorded_at ON driver_checkpoints(recorded_at DESC);

-- ============================================================
-- TABLAS DE SALES FLOW (auto-creation cuando load → booked)
-- ============================================================

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
        CHECK (earnings_status IN ('provisional', 'confirmed', 'finalized', 'reversed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES employees(employee_id),
    status_id INTEGER DEFAULT 1 REFERENCES record_status(status_id)
);

CREATE INDEX IF NOT EXISTS idx_earnings_employee_id ON earnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_earnings_load_id ON earnings(load_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings(earnings_status);

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
        
        INSERT INTO sales (total_amount, total_cost, profit_pct, total_profit,
                           sale_date, broker_id, employee_id, status_id)
        VALUES (v_rate, v_dispatch_fee,
                CASE WHEN v_rate > 0 THEN ROUND((v_profit / v_rate * 100)::NUMERIC, 2) ELSE 0 END,
                v_profit, NOW()::DATE, NEW.broker_id, NEW.dispatcher_id, 1)
        RETURNING sales_id INTO v_sales_id;
        
        INSERT INTO sales_details (sales_id, load_id, quantity, unit_price,
                                   total_amount, shipment_status, status_id)
        VALUES (v_sales_id, NEW.load_id, 1, v_rate, v_rate, 'booked', 1);
        
        IF NEW.dispatcher_id IS NOT NULL THEN
            INSERT INTO earnings (employee_id, load_id, sales_id, sale_date,
                                  earnings_amount, profit_type, earnings_status, created_by)
            VALUES (NEW.dispatcher_id, NEW.load_id, v_sales_id, NOW()::DATE,
                    v_profit, 'dispatch_fee', 'provisional', NEW.dispatcher_id);
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

-- Secuencia y trigger para load_number atómico
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

-- Helper function para obtener rol del usuario actual
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

-- Vista de analytics de ventas
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


