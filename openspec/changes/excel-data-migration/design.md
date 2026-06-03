## Context

El Excel `Loadboard.xlsx` contiene:
- **Hoja Info** (A1:BB1006): Estructura transpuesta. Columna A = claves de atributos (Owner, address, email, drivers, trucks, etc.). Columnas B–BB = registros (un carrier por columna, ~45 carriers totales)
- **Hoja Loads** (A1:AB4981): Estructura tabular. Filas = cargas. Columnas = atributos (Broker load #, Carrier, Driver, Rate, Origin City/State, Destination City/State, etc.). ~4980 cargas reales

El schema Supabase actual tiene `carriers`, `drivers`, `trucks`, `brokers`, `broker_contacts`, `routes`, `locations`, `loads` con relaciones FK.

## Goals / Non-Goals

**Goals:**
- Truncar datos de prueba preservando catálogos y configuración
- Parsear hoja Info transpuesta → insertar carriers, drivers (1-8 por carrier), trucks (1-4 por carrier)
- Parsear hoja Loads tabular → insertar brokers únicos, broker_contacts, geocodificar locations, insertar cargas
- Forzar `load_status='delivered'` y `paid_status='paid'` en todas las cargas migradas
- Mapear dispatcher por nombre desde columna Vendor, fallback "Anthony Navarro"
- Inferir `vehicle_type` del truck desde keywords en el nombre ("Hotshot"/"Reefer"/"Flatbed"/"Dry Van")
- Crear catálogo base de truck types en DB

**Non-Goals:**
- Migración bidireccional (no hay rollback automático)
- No modifica usuarios, employees ni roles
- No toca tablas de tracking, notificaciones ni billing
- No procesa trailers, factoring companies ni insurance

## Decisions

### 1. Librería de parseo
Usar **`xlsx`** (ya en `devDependencies`). API `XLSX.readFile()` + `XLSX.utils.sheet_to_json()` para ambas hojas. No convertir a CSV — parseo directo del `.xlsx`.

### 2. Orden de inserción (respeta FK inverso)
```
TRUNCATE: load_status_history → load_documents → notifications → driver_checkpoints
          → sales_details → sales → billing → loads
          → broker_contacts → brokers → trucks → drivers → carriers
INSERT:   carriers → drivers → trucks → brokers → broker_contacts
          → locations (geocoding) → routes → loads
```

### 3. Mapeo Info → carriers
- `company_name` ← header fila 1 (columna B del Excel)
- `owner_name` ← fila 3 "Owner"
- `phone_number` ← fila 4 "Owner phone"
- `email` ← fila 5 "Carrier email"
- `address` ← fila 2 "Carrier address"
- `mc_number` ← fila 25 "#MC"
- `dot_number` ← fila 26 "#USDOT"
- `employer_identification_number` ← fila 27 "#EIN o #FID" (null si vacío/"-")
- `social_security_number` ← fila 29 "#SSN" (null si vacío/"-")
- `factoring` ← boolean: true si "Factory" (fila 30) tiene valor truthy, false si vacío
- `status_id` ← 1 (Activo)
- `dispatch_fee_percent` ← 0.05 (default)

**Nota**: `carriers` en DB tiene `first_name`/`last_name` además de `owner_name`. El campo `owner_name` recibe el string completo. Los campos `first_name`/`last_name` deben setearse o el INSERT fallará — se parsea el owner y se splittea en primer espacio.

### 4. Mapeo Info → drivers (1-8 por carrier)
Por cada driver (1-8):
- `first_name` + `last_name` ← "Name driver N" (filas 9,11,13,15,17,19,21,23)
- `phone_number` ← "Phone driver N" (filas 10,12,14,16,18,18,20,22,24)
- `carrier_id` ← FK del carrier padre
- `status_id` ← 1
- `cdl_number` ← null
- `license_type` ← null
- `has_twic_card` ← false

### 5. Mapeo Info → trucks (1-4 por carrier)
Por cada truck (1-4):
- `truck_name` ← "Truck N #" (filas 42,44,46,48)
- `unit_number` ← extraído con regex `/[#\s]*(\d+)/` del truck_name
- `vehicle_type` ← inferido: keywords "hotshot"→"Hotshot", "reefer"→"Reefer", "flatbed"→"Flatbed", "dry van"→"Dry Van"; null si no hay match
- `carrier_id` ← FK del carrier padre
- `driver_id` ← primer driver del carrier
- `status_id` ← 1
- `operational_status` ← "disponible"

### 6. Mapeo Loads → brokers
- `first_name` + `last_name` ← columna "Broker"
- `mc_number` ← columna "MC Broker"
- `status_id` ← 1
- UNIQUE en `mc_number` → UPSERT

### 7. Mapeo Loads → broker_contacts
- `contact_name` ← columna "Contact"
- `email` ← columna "Mail"
- `phone` ← columna "Phone"
- `broker_id` ← FK al broker
- `is_primary` ← true
- `status_id` ← 1

### 8. Geocoding Mapbox
- Concatenar "Origin City" + "Origin State" → `"{city}, {state}"`
- Concatenar "Destination City" + "Destination State" → `"{city}, {state}"`
- POST `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={token}&country=us`
- Delay 250ms entre requests
- Cache en Map para evitar geocodificar la misma location 2 veces
- Insertar en `locations`: `formatted_address`, `city`, `state`, `lat`, `lng`, `mapbox_place_id`, `source='mapbox'`, `status_id=1`
- UNIQUE en `mapbox_place_id` → UPSERT

### 9. Mapeo Loads → routes
- `origin_location_id` ← FK a location insertada
- `destination_location_id` ← FK a location insertada
- `miles` ← columna "Miles" (null si "N/A")
- `status_id` ← 1

### 10. Mapeo Loads → loads
- `load_number` ← generado por trigger (`LD-YYYY-NNNN`), no pasar
- `carrier_id` ← lookup por nombre de columna "Carrier"
- `driver_id` ← lookup por nombre de columna "Driver" (asociado al carrier)
- `truck_id` ← primer truck del carrier
- `broker_id` ← lookup por mc_number
- `route_id` ← FK a route creada
- `rate` ← parsear columna "Rate" (quitar `$`, comas, espacios)
- `booked_at` ← columna "Pick up Date" (convertir de Excel serial date)
- `picked_up_at` ← columna "Pick up Date"
- `delivered_at` ← columna "Drop Date"
- `load_status` ← 'delivered' (forzado)
- `paid_status` ← 'paid' (forzado)
- `status_id` ← 1
- `factoring` ← carrier.factoring
- `dispatch_fee_pct` ← 0.05 (dejar que DB calcule dispatch_fee)
- `dispatcher_id` ← lookup por nombre de columna "Vendor", fallback "Anthony Navarro" employee

### 11. Manejo de errores
- try/catch por fila con log de error + fila número
- Skip filas con carrier/driver no encontrados (log warning, continuar)
- Geocoding fallido → log warning, route sin location_ids
- Resumen final: X carriers, Y drivers, Z trucks, W brokers, V loads insertados

## Risks / Trade-offs

- **Geocoding rate limit**: 4980 requests × 250ms = ~20 min de runtime. Mapbox tiene rate limits de 600/min. Con delay de 250ms = 240/min, dentro del límite pero lento.
- **Mapbox gratuito**: Plan gratuito tiene límite de geocoding. ~4980 requests puede consumir el quota. El script incluye cache para minimizar requests duplicados.
- **Dates en Excel**: Excel almacena fechas como serial numbers (ej. 46176 = 2026-06-03). Conversión requerida con `(serial - 25569) * 86400 * 1000`.
- **Caracteres especiales en nombres**: Nombres como "Albert A Castro" vs "Albert A. Castro" — el matching debe ser flexible (case-insensitive, trim).
- **Duplicados en carriers**: Mismo carrier puede aparecer múltiples veces en Info sheet (columnas con Owner vacío). Solo insertar si Owner tiene datos.

## Migration Plan

1. **Crear catálogo truck types**: INSERT INTO cargo_types (Reefer, Flatbed, Hotshot, Dry Van, step_deck, lowboy)
2. **Ejecutar script en orden**: node scripts/migrate_from_excel.ts
3. **Verificar counts**: SELECT count(*) por tabla para confirmar migración exitosa
4. **Rollback manual**: DELETE cascade en orden inverso si hay problemas

## Open Questions

Ninguna — todas las decisiones fueron confirmadas por el usuario.

## Catálogo de Truck Types

Insertar en `cargo_types` (o usar `vehicle_type` en trucks, que es VARCHAR libre):

```sql
INSERT INTO cargo_types (cargo_type_name, status_id) VALUES
  ('Reefer', 1), ('Flatbed', 1), ('Hotshot', 1),
  ('Dry Van', 1), ('Step Deck', 1), ('Lowboy', 1)
ON CONFLICT DO NOTHING;
```