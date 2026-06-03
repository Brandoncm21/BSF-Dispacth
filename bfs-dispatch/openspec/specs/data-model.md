# BFS Dispatch — Data Model

> Esquema de base de datos PostgreSQL (Supabase) — baseline actual.

---

## 1. Catálogos Maestros

| Tabla | PK | Columnas clave | Uso |
|-------|----|----------------|-----|
| `record_status` | `status_id` (serial) | `status_name` | Catálogo maestro de estados (Activo=1, Inactivo=2). Referenciado por la mayoría de tablas. |
| `roles` | `role_id` (serial) | `role_name`, `role_type` (CHECK: admin, dispatcher, logistics, sales, back_office), `status_id` | Roles de usuario del sistema. |
| `license_types` | `license_type_id` | `license_type_name`, `status_id` | Tipos de licencia de conducir. |
| `cargo_types` | `cargo_type_id` | `cargo_type_name`, `status_id` | Tipos de carga (refrigerada, seca, etc.). |
| `special_requirements` | `special_requirements_id` | `requirement_description`, `status_id` | Requisitos especiales (Hazmat, TWIC, etc.). |

---

## 2. Geografía (Normalización en 4 niveles)

```
states (1) ──> cities (N)
states (1) ──> streets (N)
cities (1) ──> streets (N)
streets (1) ──> addresses (N)
addresses (1) ──> routes (N)
```

| Tabla | PK | FK | Descripción |
|-------|----|----|-------------|
| `states` | `state_id` | — | Estados de EE.UU. |
| `cities` | `city_id` | `state_id` | Ciudades |
| `streets` | `street_id` | `city_id`, `state_id` | Calles |
| `addresses` | `address_id` | `street_id`, `state_id` | Dirección completa (referencia a calle + número opcional) |
| `routes` | `route_id` | `origin_address_id`, `destination_address_id` | Ruta origen-destino con millas y tiempo estimado |

---

## 3. Personas y Empresas

| Tabla | PK | Columnas clave | Relaciones |
|-------|----|----------------|------------|
| `brokers` | `broker_id` | `first_name`, `last_name`, `email`, `phone_number`, `mc_number`, `usdot_number`, `status_id` | 1:N `sales`, 1:N `broker_contacts` |
| `broker_contacts` | `contact_id` | `broker_id`, `contact_name`, `email`, `phone`, `is_primary` | Contactos asociados a un broker |
| `carriers` | `carrier_id` | `company_name`, `owner_name`, `address`, `phone_number`, `email`, `motor_carrier_id`, `usdot`, `ein`, `ssn`, `factoring`, `mc_number`, `dot_number`, `dispatch_fee_percent` (NUMERIC 5,4, default 0.05), `status_id` | 1:N `trucks`, 1:N `drivers`, 1:N `loads` |
| `drivers` | `driver_id` | `first_name`, `last_name`, `phone_number`, `license_type`, `cdl_number`, `has_twic_card`, `carrier_id`, `status_id` | N:1 `carriers` |
| `employees` | `employee_id` | `first_name`, `last_name`, `role_id`, `auth_user_id` (UUID -> auth.users), `dispatch_vendor`, `email`, `status_id` | N:1 `roles`. Trigger: `on_auth_user_created` auto-crea registro. |

---

## 4. Operaciones

| Tabla | PK | Columnas clave | Relaciones |
|-------|----|----------------|------------|
| `trucks` | `truck_id` | `unit_number`, `vehicle_type`, `capacity`, `operational_status`, `plate_number`, `vin`, `truck_name`, `empty_weight`, `photo_url`, `driver_id`, `carrier_id`, `status_id` | N:1 `carriers`, N:1 `drivers` (default driver) |
| `loads` | `load_id` | `load_number` (UNIQUE, trigger), `load_data`, `weight_lbs`, `rate`, `dispatch_fee_pct`, `factoring`, `load_status` (pending, booked, picked_up, delivered, paid), `paid_status` (unpaid, partial, paid), `booked_at`, `picked_up_at`, `delivered_at`, `paid_at`, `carrier_id`, `truck_id`, `driver_id`, `route_id`, `dispatcher_id`, `cargo_type_id`, `special_requirements_id`, `status_id` | FK múltiples. Auditoría en `load_status_history`. |
| `sales` | `sales_id` | `total_amount`, `total_cost`, `profit_pct`, `total_profit`, `sale_date`, `broker_id`, `employee_id`, `status_id` | N:1 `brokers`, N:1 `employees` |
| `sales_details` | `sales_details_id` | `total`, `quantity`, `unit_price`, `total_amount`, `discount`, `tax_amount`, `shipment_status`, `load_id`, `sales_id`, `status_id` | N:1 `loads`, N:1 `sales` |
| `billing` | `invoice_id` | `invoice_number`, `issue_date`, `total_amount`, `taxes`, `sales_id`, `status_id` | N:1 `sales` |

---

## 5. Documentos, Auditoría y Mantenimiento

| Tabla | PK | Columnas clave | Descripción |
|-------|----|----------------|-------------|
| `load_documents` | `document_id` | `load_id`, `document_type` (BOL, RC, POD), `file_path`, `file_name`, `file_size`, `uploaded_at`, `uploaded_by` | Metadatos de PDFs subidos a Supabase Storage bucket `load_documents`. |
| `load_status_history` | `history_id` | `load_id`, `old_status`, `new_status`, `changed_by`, `changed_at`, `notes` | Auditoría de cada transición de estado de carga. |
| `maintenance_records` | `maintenance_id` | `truck_id`, `maintenance_type`, `maintenance_date`, `mileage`, `description`, `cost`, `mechanic_notes`, `status_id` | Historial de mantenimiento por camión. |

---

## 6. Tracking y Notificaciones (Nuevo)

| Tabla | PK | Columnas clave | Descripción |
|-------|----|----------------|-------------|
| `driver_checkpoints` | `checkpoint_id` | `load_id`, `driver_id`, `lat` (DECIMAL), `lng` (DECIMAL), `status_at_checkpoint`, `notes`, `recorded_at` | Checkpoints GPS reportados por choferes. |
| `notifications` | `notification_id` | `recipient_type`, `recipient_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at` | Notificaciones in-app persistentes. |
| `notification_preferences` | `preference_id` | `user_id`, `type`, `enabled` | Preferencias de notificación por usuario. |

---

## 7. Vistas

### Vistas operativas

| Vista | Propósito |
|-------|-----------|
| `active_loads_v` | Cargas activas con joins a cargo_types, special_requirements, drivers, trucks, carriers, employees |
| `loads_v` | Cargas con IDs clave desnormalizados |
| `trucks_v` | Camiones con nombre compuesto y carrier |
| `dispatchers_v` | Empleados con rol y estado |
| `routes_v` | Rutas con direcciones origen/destino legibles |
| `brokers_v` | Brokers con nombre completo |
| `carriers_v` | Carriers con nombre completo |
| `drivers_v` | Drivers con nombre de carrier |
| `employees_v` | Empleados con estado legible |
| `sales_v` | Ventas con estado |
| `sales_details_v` | Detalles de venta con estado |
| `billing_v` | Facturas con sales y estado |
| `special_requirements_v` | Requerimientos especiales con estado |

### Vistas analíticas

| Vista | Propósito |
|-------|-----------|
| `v_sales_performance` | Analytics de ventas con broker, dispatcher, estados origen/destino, load_number, rate, dispatch_fee |
| `v_sales_performance_extended` | Versión extendida usada por dashboard, reports y executive analytics |
| `trucks_with_availability` | Estado inteligente (`disponible`, `en_ruta`, `maintenance`), carga activa actual, ruta actual |
| `v_executive_bi_metrics` | Métricas agregadas para dashboard ejecutivo |

---

## 8. Funciones RPC

### Autenticación

| Función | Retorno | Descripción |
|---------|---------|-------------|
| `get_current_user_role()` | `TABLE(role_type VARCHAR)` | Rol del usuario autenticado |
| `get_user_role_type()` | `TEXT` | Versión simplificada del rol actual |

### Búsquedas paginadas (STABLE SECURITY DEFINER)

| Función | Args | Retorno |
|---------|------|---------|
| `search_carriers(p_search, p_status_id, p_limit, p_offset)` | TEXT, INT, INT, INT | carriers + status_name + total_count |
| `search_drivers(...)` | TEXT, INT, INT, INT | drivers + carrier_company_name + has_twic_card + total_count |
| `search_brokers(...)` | TEXT, INT, INT, INT | brokers + mc_number + usdot_number + total_count |
| `search_trucks(...)` | TEXT, INT, INT, INT | trucks + carrier_company_name + driver_name + total_count |
| `search_loads(...)` | TEXT, TEXT, INT, INT | loads + carrier_name + driver_name + total_count |
| `search_employees(...)` | TEXT, TEXT, TEXT, INT, INT | employees + role_name + role_type + status_name + total_count |

### Utilidades

| Función | Descripción |
|---------|-------------|
| `get_trucks_with_smart_status()` | Estado inteligente + carga activa |
| `get_truck_load_history(p_truck_id, p_days)` | Historial de cargas del camión |
| `get_truck_status_history(p_truck_id, p_days)` | Historial de estados del camión |
| `get_maintenance_records(p_truck_id)` | Registros de mantenimiento |
| `get_broker_contacts(p_broker_id)` | Contactos del broker |
| `get_carrier_dispatch_fee(p_carrier_id)` | Dispatch fee del carrier |
| `get_drivers_by_carrier(p_carrier_id)` | Drivers por carrier |
| `get_trucks_by_carrier(p_carrier_id)` | Camiones por carrier |

### Gestión de rutas (atómicas)

| Función | Descripción |
|---------|-------------|
| `get_or_create_city(...)` | Upsert de ciudad |
| `get_or_create_street(...)` | Upsert de calle |
| `get_or_create_address(...)` | Upsert de dirección |
| `create_route_full(...)` | Crea ruta completa con origen/destino en una transacción |

### Administración

| Función | Descripción |
|---------|-------------|
| `handle_new_user()` | Trigger: crea `employees` al registrar usuario en auth.users |
| `update_employee_role(p_employee_id, p_new_role_id)` | Solo admin puede cambiar roles |
| `toggle_employee_status(p_employee_id)` | Activa/desactiva empleado |

---

## 9. Secuencias y Triggers

| Nombre | Tipo | Tabla | Descripción |
|--------|------|-------|-------------|
| `loads_seq` START 1 | Secuencia | `loads` | Generación atómica de `load_number` |
| `set_load_number` | Trigger BEFORE INSERT | `loads` | Genera `LD-<YYYY>-<NNNN>` si `load_number` es NULL |
| `on_auth_user_created` | Trigger AFTER INSERT | `auth.users` | Crea registro en `employees` con rol default |

---

## 10. Políticas RLS

| Dominio | Tablas | Política general |
|---------|--------|-----------------|
| Catálogos | `record_status`, `roles`, `license_types`, `cargo_types`, `special_requirements`, `states`, `cities`, `streets`, `addresses` | SELECT: authenticated. WRITE: admin only. |
| Brokers | `brokers` | SELECT: authenticated. WRITE: admin. |
| Carriers / Drivers | `carriers`, `drivers` | SELECT: authenticated. WRITE: admin. |
| Employees | `employees` | SELECT: admin o propio registro (`auth_user_id = auth.uid()`). WRITE: admin. |
| Trucks / Routes | `trucks`, `routes` | SELECT: authenticated. INSERT: authenticated. |
| Loads | `loads` | READ/WRITE: admin O dispatcher asignado (`loads.dispatcher_id = employee_id`). |
| Sales / Billing | `sales`, `sales_details`, `billing` | READ/WRITE: admin only. |
| Documentos | `load_documents` | READ/WRITE: admin o dispatcher de la carga asociada. |
| Historial | `load_status_history` | READ: authenticated. WRITE: admin o cualquier authenticated. |

### Storage RLS
Bucket: `load_documents`
- SELECT: admin o dispatcher asignado a la carga.
- INSERT: admin o cualquier authenticated.
- DELETE: admin only.

---

## 11. Diagrama de Relaciones (Resumen)

```
auth.users (Supabase)
    │
    └── 1:1 employees (auth_user_id)
            │
            ├── N:1 roles (role_id)
            │
            ├── 1:N loads (dispatcher_id)
            │
            ├── 1:N sales (employee_id)
            │
            ├── 1:N load_documents (uploaded_by)
            │
            └── 1:N load_status_history (changed_by)

record_status
    ├── 1:N roles
    ├── 1:N carriers
    ├── 1:N drivers
    ├── 1:N trucks
    ├── 1:N routes
    ├── 1:N loads
    ├── 1:N sales
    ├── 1:N sales_details
    ├── 1:N billing
    └── 1:N maintenance_records

states ──> cities ──> streets ──> addresses ──> routes ──> loads
carriers ──> trucks, drivers, loads
trucks ──> loads, maintenance_records
drivers ──> loads
brokers ──> sales, broker_contacts
cargo_types ──> loads
special_requirements ──> loads
sales ──> sales_details, billing
loads ──> sales_details, load_documents, load_status_history
```
