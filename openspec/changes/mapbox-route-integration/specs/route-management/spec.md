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

## REMOVED Requirements

### Requirement: Crear ruta con wizard de 3 pasos
**Reason**: El wizard anidado (Estado → Ciudad → Calle) se reemplaza por Mapbox Autocomplete directo. La UX es más rápida y precisa.
**Migration**: Las rutas creadas con el wizard antiguo fueron migradas a `locations` en el script batch.

### Requirement: Upsert de direcciones manual (get-or-create de cities/streets/addresses)
**Reason**: La normalización de geografía (states→cities→streets→addresses) se elimina. Las direcciones se guardan directamente desde la respuesta de Mapbox.
**Migration**: Las funciones RPC `get_or_create_city`, `get_or_create_street`, `get_or_create_address` y `create_route_full` se eliminan.
