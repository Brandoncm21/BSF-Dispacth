## Context

- `loads` tiene `origin_address_id` y `destination_address_id` en desuso (confirmado: solo existen en schema/DB, no se usan en código app)
- `routes` tiene `origin_address_id` y `destination_address_id` como FKs activas (usadas por `NewRouteModal`, `RouteSelector`, `create_route_full` RPC)
- El wizard `NewRouteModal` (604 líneas) usa 3 pasos: Estado → Ciudad → Calle + geocodificación manual de "Ciudad, Estado" (poco precisa)

## Goals / Non-Goals

**Goals:**
1. Usuario escribe dirección completa → Mapbox sugiere opciones → selecciona → lat/lng + formatted_address se guardan automáticamente
2. Distancia se calcula con lat/lng exactos vía Mapbox Directions API
3. Rate/milla se calcula como dato informativo después de ingresar rate manualmente
4. Migración batch completa de datos históricos a `locations`
5. Eliminación total de tablas viejas (`addresses`, `streets`, `cities`)

**Non-Goals:**
- Rate sugerido automáticamente (mantiene simple)
- Cambio de token/config de Mapbox (usa el mismo)
- PostGIS o queries espaciales avanzadas
- Modificar `states` table (se mantiene como catálogo de referencia)

## Decisions

### D1: Tabla `locations` denormalizada sobre JSONB
- **Opciones**: Tabla `locations` con columnas planas, JSONB en `routes`, mantener normalización actual
- **Elegido**: Tabla `locations` con columnas planas
- **Rationale**: Reusable entre rutas, indexable, simple de query. JSONB es más flexible pero más difícil de buscar y tipar. La normalización actual es el problema que estamos resolviendo.

### D2: `mapbox_place_id` como UNIQUE para deduplicación
- **Opciones**: UNIQUE por `mapbox_place_id`, deduplicar por `formatted_address`, no deduplicar
- **Elegido**: UNIQUE `mapbox_place_id`
- **Rationale**: Mapbox normaliza por nosotros. Misma dirección = mismo place_id. No hay ambigüedad.

### D3: `states` table se mantiene
- **Opciones**: Eliminar `states`, mantener `states` como catálogo, migrar `states` a `locations`
- **Elegido**: Mantener `states` como catálogo maestro
- **Rationale**: `states` se usa en empleados, carriers, y otros módulos no relacionados a rutas. No es parte del problema de direcciones.

### D4: Migración batch vía script Node.js
- **Opciones**: Script Node.js/Supabase Edge Function, SQL puro, migración manual
- **Elegido**: Script Node.js ejecutado una vez
- **Rationale**: Geocodificación masiva requiere llamadas a Mapbox API. SQL puro no puede hacer HTTP requests. Edge Function es overkill para una migración one-off.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Mapbox rate limits durante migración batch | Script con delays (1 req/seg), reintentos, resumen de fallidos |
| Vistas y funciones RPC dependen de tablas viejas | Reescribir `routes_v`, `loads_v`, `search_loads`, `v_sales_performance_extended` en la misma migración |
| `database.types.ts` drift | Actualizar manualmente o integrar `supabase gen types` en CI |
| Rutas sin geocodificación exitosa | Dejar `lat`/`lng` como NULL para esos casos. El sistema sigue funcionando con texto. |

## Migration Plan

### Step 1: Crear tabla `locations` con índices
### Step 2: Script batch: leer todas las direcciones de `addresses→streets→cities→states`, geocodificar con Mapbox, insertar en `locations`
### Step 3: Actualizar `routes`: agregar `origin_location_id`, `destination_location_id`, poblar desde `locations`
### Step 4: Actualizar `loads`: eliminar `origin_address_id`, `destination_address_id`
### Step 5: Reescribir vistas y funciones RPC que hacen JOIN a `addresses`
### Step 6: Eliminar tablas `addresses`, `streets`, `cities` (y sus FKs constraints)
### Step 7: Dropear funciones RPC viejas: `get_or_create_address`, `get_or_create_street`, `get_or_create_city`, `create_route_full`
### Step 8: Actualizar `database.types.ts`

## Rollback

- Las tablas viejas se pueden recrear desde `schema.sql` si es necesario (pero los datos se pierden tras DROP)
- Antes del DROP, exportar backup de `addresses`, `streets`, `cities` como SQL dump

## Open Questions

1. ¿Reescribir `search_loads` RPC para que las búsquedas por ciudad/estado usen `locations` en vez de `addresses`?
2. ¿Agregar índice GIN o trigram en `locations.formatted_address` para búsquedas textuales avanzadas?
