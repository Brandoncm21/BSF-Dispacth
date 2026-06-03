## Why

4980 cargas y 45 carriers en el Excel de producción (Loadboard.xlsx) deben reemplazar los datos de prueba actuales en Supabase. El sistema BFS Dispatch opera con datos ficticios de prueba; esta migración lo convierte en datos operativos reales.

## What Changes

Pipeline de migración de 4 fases queLee `Loadboard.xlsx` (2 hojas: Info transpuesta + Loads tabular), parsea y limpia los datos, inserta en Supabase preservando integridad referencial y forzando estado completado/pagado en todas las cargas.

## Capabilities

### New Capabilities

- `excel-data-migration`: Script de migración unidireccional Excel → Supabase queparsea la hoja Info (transpuesta) para carriers/drivers/trucks y la hoja Loads (tabular) para brokers/rutas/cargas con geocoding Mapbox.

### Modified Capabilities

Ninguna. Esta migración no modifica comportamiento del sistema — solo importa datos.

## Impact

- **Supabase**: Truncate de datos de prueba en loads, drivers, carriers, trucks, brokers, broker_contacts. Preserva rutas, locations, employees, catálogos.
- **Dependencias**: `xlsx` (ya instalada como devDependency)
- **API Mapbox**: Geocoding para origen/destino de cargas. ~4980 requests (250ms delay = ~20minruntime). Requiere `MAPBOX_TOKEN` en `.env.local`
- **Seguridad**: El script solo debe ejecutarse en desarrollo/local — nunca en producción. Requiere `SUPABASE_SERVICE_ROLE_KEY`