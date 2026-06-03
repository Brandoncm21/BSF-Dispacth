## Why

El flujo actual para crear una ruta en el formulario de Nueva Carga requiere un wizard de 3 pasos con selects anidados (Estado → Ciudad → Calle), 6+ clicks y múltiples requests secuenciales. Los usuarios pierden tiempo y la experiencia es propensa a errores. Además, el esquema de base de datos tiene una normalización excesiva (states→cities→streets→addresses→routes) que genera joins de 5 niveles y código difícil de mantener.

## What Changes

- Integrar Mapbox Autocomplete en el formulario de Nueva Carga para buscar direcciones de Origen/Destino
- Autocalcular distancia en millas y mostrar costo estimado de combustible
- Mostrar rate por milla como dato informativo después de ingresar el rate manualmente
- **BREAKING**: Reestructurar el esquema de direcciones de normalizado a denormalizado (`locations` table)
- **BREAKING**: Eliminar columnas en desuso `origin_address_id` y `destination_address_id` de la tabla `loads`
- Eliminar tablas viejas (`addresses`, `streets`, `cities`) tras migración batch de datos históricos
- Refactorizar `NewRouteModal` de wizard de 3 pasos a selector de direcciones directo

## Capabilities

- **New Capabilities**:
  - `mapbox-autocomplete`: Búsqueda de direcciones con Mapbox Places API
  - `route-cost-calculation`: Autocalculo de distancia y costos derivados
  - `tracking-map-visuals`: Marcadores de origen/destino y waypoints en todos los mapas de tracking (`/traceability`, `LoadDetailModal`)
- **Modified Capabilities**:
  - `route-management`: Creación de rutas con Mapbox Autocomplete en vez de wizard anidado. Soporte de waypoints múltiples (pickups/deliveries) via JSONB en `routes`
  - `loads-management`: Eliminación de dependencia a `origin_address_id`/`destination_address_id` en `loads`. Tab "Mapa de Tracking" en modal muestra ruta completa con paradas

## Impact

- Frontend: Nuevos componentes `MapboxAutocomplete`, `LocationPicker`, refactor de `NewRouteModal`, actualización de `TrackingMap` con marcadores distintivos (origen/destino/waypoints)
- Backend: Nueva tabla `locations`, migración SQL batch, nuevas server actions, deprecación de `getOrCreateAddress`/`getOrCreateStreet`/`getOrCreateCity`
- Database: DROP de tablas `addresses`, `streets`, `cities`, ALTER de `loads` y `routes` (+ columna `waypoints` JSONB), nuevos índices
- Breaking: Las vistas `routes_v`, `loads_v`, `v_sales_performance_extended` y funciones `search_loads`, `getRoutesWithDetails` requieren actualización
