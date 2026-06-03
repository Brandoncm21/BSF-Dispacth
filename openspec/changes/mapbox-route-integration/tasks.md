## 1. Database Schema & Migration
- [x] 1.1 Crear tabla `locations` con columnas, índices y constraints
- [x] 1.2 Agregar `origin_location_id` y `destination_location_id` a `routes`
- [x] 1.3 Script batch: migrar direcciones históricas de `addresses→streets→cities` a `locations`
- [x] 1.4 Poblar `routes.origin_location_id` y `routes.destination_location_id` desde migración
- [x] 1.5 Eliminar columnas `origin_address_id` y `destination_address_id` de `loads`
- [x] 1.6 Reescribir vistas: `routes_v`, `loads_v`, `v_sales_performance_extended`
- [x] 1.7 Reescribir función RPC `search_loads` (quitar JOINs a `addresses`)
- [x] 1.8 Eliminar funciones RPC: `get_or_create_city`, `get_or_create_street`, `get_or_create_address`, `create_route_full`
- [x] 1.9 Dropear tablas: `addresses`, `streets`, `cities` (mantener `states`)
- [x] 1.10 Eliminar índices obsoletos: `idx_loads_origin_address_id`, `idx_loads_destination_address_id`
- [x] 1.11 Agregar columna `waypoints JSONB DEFAULT '[]'` a `routes` para paradas intermedias

## 2. Backend (Server Actions)
- [x] 2.1 Crear `searchLocations(query)` — búsqueda ILIKE en `locations.formatted_address`
- [x] 2.2 Crear `getOrCreateLocation(mapboxData)` — upsert por `mapbox_place_id`
- [x] 2.3 Crear `getLocationById(id)` — lookup simple
- [x] 2.4 Refactorizar `calculateRouteMiles(lat1, lng1, lat2, lng2)` — usar coords directo
- [x] 2.5 Refactorizar `getRoutesWithDetails()` — 2 joins (routes→locations) en vez de 5
- [x] 2.6 Refactorizar `createRoute()` — INSERT simple con `origin_location_id`, `destination_location_id`
- [x] 2.7 Deprecar y eliminar: `getOrCreateAddress`, `getOrCreateStreet`, `getOrCreateCity`, `searchStreets`
- [x] 2.8 Actualizar `database.types.ts` manualmente

## 3. Frontend (Components)
- [x] 3.1 Crear componente `MapboxAutocomplete` — input reutilizable con Mapbox Places API
- [x] 3.2 Crear componente `LocationPicker` — par Origen/Destino usando `MapboxAutocomplete`
- [x] 3.3 Refactorizar `NewRouteModal` — reemplazar wizard 3 pasos por `LocationPicker` + calcular millas
- [x] 3.4 Refactorizar `RouteSelector` — usar `formatted_address` de `locations`, agregar búsqueda incremental
- [x] 3.5 Actualizar `LoadForm` — mostrar rate/milla informativo (rate ÷ miles)
- [x] 3.6 Eliminar componentes obsoletos: `AddressModal` (si existe), `new-route-modal` viejo (si se renombra)

## 4. Tracking Map Visuals (origin/dest/waypoints)
- [x] 4.1 Migration SQL: routes.waypoints JSONB aplicada via MCP
- [x] 4.2 `TrackingMap`: funciones helper para SVG flag (verde), pin (rojo), dot (azul numerado)
- [x] 4.3 `TrackingMap`: origen/dest effect con fitBounds + planned route line
- [x] 4.4 `TrackingMap`: truck markers effect extendido con route markers por cada truck
- [x] 4.5 `TrackingMap`: checkpoint effect condicional (solo si no hay origen/dest)
- [x] 4.6 `TraceabilityPage`: fetch route info (locations join) + incluir en trackingMarkers
- [x] 4.7 `LoadDetailModal TabTracking`: fetch route origin/dest/waypoints + pasar a TrackingMap
- [x] 4.8 Build: 0 TypeScript errors

## 5. Real Road Geometry (Mapbox Directions API)
- [x] 5.1 `calculateRouteMiles()`: accept waypoints array, return `geometry` from Directions API
- [x] 5.2 `TrackingMap`: add `routeGeometry` prop, draw real road line when available
- [x] 5.3 `LoadDetailModal TabTracking`: fetch geometry via `calculateRouteMiles()`, pass to TrackingMap
- [x] 5.4 Update specs: `route-cost-calculation` (waypoints + real distance), `tracking-map-visuals` (Directions API)
- [x] 5.5 ADR-0008: Mapbox Directions API for real route lines
- [x] 5.6 Build: 0 TypeScript errors

## 6. Testing & Validation
- [ ] 6.1 Test: Crear ruta nueva con Mapbox Autocomplete
- [ ] 6.2 Test: Reutilizar dirección existente (mismo mapbox_place_id)
- [ ] 6.3 Test: Calcular distancia automática con lat/lng exactos
- [ ] 6.4 Test: Crear carga con nueva ruta sin `origin_address_id`/`destination_address_id`
- [ ] 6.5 Test: Verificar que datos históricos siguen visibles (rutas viejas migradas)
- [ ] 6.6 Validar: `openspec validate mapbox-route-integration --type change --strict`

## 7. ADR
- [x] 7.1 Crear ADR-0007: Use Denormalized locations table over Normalized addresses/streets/cities
- [x] 7.2 Crear ADR-0008: Mapbox Directions API for real route lines
