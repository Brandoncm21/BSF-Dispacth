## MODIFIED Requirements

### Requirement: Crear una nueva carga (versión actualizada)

La creación de carga ya no depende de `origin_address_id`/`destination_address_id` en `loads`.

#### Scenario: Creación de carga con ruta simplificada
GIVEN un usuario autenticado con rol de dispatcher
Y está en la página de cargas
WHAND abre el formulario de nueva carga
Y selecciona carrier, driver, truck
Y selecciona una ruta creada con el nuevo sistema de `locations`
Y ingresa los demás datos de la carga
Y confirma la creación
THEN el sistema crea la carga en `loads` con `route_id` como única referencia a origen/destino
Y NO guarda `origin_address_id` ni `destination_address_id` (columnas eliminadas)

## REMOVED Requirements

### Requirement: Guardar origin_address_id y destination_address_id en loads
**Reason**: Estas columnas estaban en desuso. La fuente de verdad para origen/destino es `route_id` → `routes` → `locations`.
**Migration**: Las columnas se eliminan de la tabla `loads`. Los datos históricos no se pierden porque fueron migrados a `locations` y vinculados a través de `routes`.
