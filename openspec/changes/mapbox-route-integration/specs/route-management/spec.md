## MODIFIED Requirements

### Requirement: Crear una nueva ruta (versión actualizada)

REEMPLAZA el wizard de 3 pasos por un selector de direcciones directo con Mapbox.

#### Scenario: Crear ruta con Mapbox Autocomplete
GIVEN un usuario autenticado
Y está creando una nueva carga o abriendo el modal de nueva ruta
WHAND ingresa la dirección de origen usando Mapbox Autocomplete
Y ingresa la dirección de destino usando Mapbox Autocomplete
Y el sistema calcula automáticamente la distancia
Y el usuario confirma la creación
THEN el sistema:
  1. Upsertea ambas direcciones en `locations` (busca por mapbox_place_id, crea si no existe)
  2. Crea la ruta en `routes` con `origin_location_id`, `destination_location_id`, `miles`
Y la ruta aparece disponible para seleccionar en `RouteSelector`

## NEW Requirements

### Requirement: Crear ruta con soporte de waypoints

- `SHALL-ROUTE-WAY-01`: El modal de crear/editar ruta DEBE permitir agregar **0 o más waypoints** intermedios.
- `SHALL-ROUTE-WAY-01a`: Cada waypoint DEBE tener los campos: tipo (pickup | delivery), dirección (Mapbox Autocomplete).
- `SHALL-ROUTE-WAY-01b`: El usuario DEBE poder agregar, reordenar y eliminar waypoints antes de guardar.
- `SHALL-ROUTE-WAY-02`: Al guardar, los waypoints SE almacenan como JSONB en `routes.waypoints` con la estructura:
  ```json
  [
    { "sequence": 1, "location_id": 123, "type": "pickup", "lat": 25.76, "lng": -80.19 },
    { "sequence": 2, "location_id": 124, "type": "delivery", "lat": 26.12, "lng": -80.14 }
  ]
  ```
- `SHALL-ROUTE-WAY-02a`: `location_id` MUST referenciar un registro existente en `locations`.
- `SHALL-ROUTE-WAY-02b`: `lat`/`lng` SE copian desde `locations` al JSONB para permitir renderizado en mapa sin joins.
- `SHALL-ROUTE-WAY-03`: La distancia total (`miles`) DEBE recalcularse automáticamente considerando origen → waypoints (en secuencia) → destino.
- `SHALL-ROUTE-WAY-03a`: El cálculo usa Mapbox Directions API con waypoints como via points.

#### Scenario: Crear ruta con paradas intermedias
GIVEN un usuario autenticado
Y está en el modal de nueva ruta
WHEN ingresa dirección de origen
AND ingresa dirección de destino
AND hace clic en "+ Agregar Parada"
AND selecciona tipo "Pickup" y busca dirección con Mapbox Autocomplete
AND repite para agregar una parada "Delivery"
AND confirma la creación
THEN el sistema:
  1. Upsertea todas las direcciones en `locations` (origen, destino, 2 waypoints)
  2. Crea la ruta en `routes` con `origin_location_id`, `destination_location_id`, `waypoints` JSONB, `miles`
  3. Las millas reflejan la distancia total incluyendo los desvíos por waypoints

## REMOVED Requirements

### Requirement: Crear ruta con wizard de 3 pasos
**Reason**: El wizard anidado (Estado → Ciudad → Calle) se reemplaza por Mapbox Autocomplete directo. La UX es más rápida y precisa.
**Migration**: Las rutas creadas con el wizard antiguo fueron migradas a `locations` en el script batch.

### Requirement: Upsert de direcciones manual (get-or-create de cities/streets/addresses)
**Reason**: La normalización de geografía (states→cities→streets→addresses) se elimina. Las direcciones se guardan directamente desde la respuesta de Mapbox.
**Migration**: Las funciones RPC `get_or_create_city`, `get_or_create_street`, `get_or_create_address` y `create_route_full` se eliminan.
