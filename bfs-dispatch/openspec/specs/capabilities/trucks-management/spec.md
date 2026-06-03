# Capability: Trucks Management

> Gestión de camiones: registro, edición, tipos de vehículo, mantenimiento y eliminación lógica.

---

### Requirement: Registrar un nuevo camión

Un usuario autorizado debe poder crear un nuevo camión.

#### Scenario: Creación exitosa de camión
GIVEN un usuario autenticado con rol de admin, back_office o logistics
Y está en la página de trucks
WHAND abre el formulario de nuevo camión
Y ingresa unit_number, truck_name, placa, VIN
Y selecciona carrier y tipo de vehículo (Semi, Hotshot, Box Truck, Furgón, Camión, Refrigerado)
Y asigna un chofer por defecto
Y establece capacidad, peso vacío y estado operacional
Y confirma la creación
THEN el sistema guarda el camión en la base de datos
Y aparece en la lista de trucks

---

### Requirement: Editar un camión existente

Un usuario autorizado debe poder modificar los datos de un camión.

#### Scenario: Edición de camión
GIVEN un camión existente
Y un usuario con permisos de escritura
WHAND edita el chofer asignado o el estado operacional
Y guarda los cambios
THEN el sistema actualiza el camión

#### Scenario: Bloqueo de cambio de estado si está en ruta
GIVEN un camión con estado operacional "in_route"
Y un usuario intenta cambiar el estado a "maintenance"
WHAND intenta guardar
THEN el sistema bloquea el cambio
Y muestra un mensaje indicando que no se puede cambiar el estado porque el camión está en ruta

---

### Requirement: Buscar camiones

Los usuarios deben poder buscar camiones por unit number, placa o VIN.

#### Scenario: Búsqueda por unit number
GIVEN un usuario en la página de trucks
WHAND ingresa un término de búsqueda
THEN el sistema muestra trucks cuyo unit_number, placa o VIN coincidan
Y pagina los resultados de 16 en 16

---

### Requirement: Gestionar mantenimiento de un camión

El sistema debe permitir registrar y consultar el historial de mantenimiento.

#### Scenario: Agregar registro de mantenimiento
GIVEN un camión existente
Y un usuario autorizado
WHAND abre el panel de mantenimiento
Y selecciona el tipo (Cambio de Aceite, Rotación de Llantas, Frenos, Inspección FMCSA, etc.)
Y ingresa fecha, millaje, costo, descripción y notas del mecánico
THEN el sistema guarda el registro en `maintenance_records`
Y aparece en el historial del camión

#### Scenario: Ver historial de mantenimiento
GIVEN un camión con registros de mantenimiento
WHAND el usuario abre el panel de mantenimiento
THEN se muestra una lista cronológica de todos los registros
Y cada registro muestra tipo, fecha, millaje, costo y descripción

#### Scenario: Recordatorio FMCSA
GIVEN un camión con inspección FMCSA registrada
WHAND se acerca la fecha de la próxima inspección requerida
THEN el sistema muestra una alerta o recordatorio en el panel de mantenimiento

---

### Requirement: Ver disponibilidad de camiones

El sistema debe mostrar el estado de disponibilidad de cada camión.

#### Scenario: Vista de disponibilidad
GIVEN un usuario en la página de trucks
WHAND visualiza la lista de camiones
THEN cada camión muestra su estado de disponibilidad:
  - `disponible` (verde): sin carga activa
  - `en_ruta` (ámbar): con carga activa
  - `maintenance` (rojo): con registro de mantenimiento activo

---

### Requirement: Eliminar un camión (soft delete)

Un usuario autorizado debe poder desactivar un camión.

#### Scenario: Desactivación de camión
GIVEN un camión activo que no está en ruta
Y un usuario con permisos de admin
WHAND selecciona eliminar el camión
THEN el sistema cambia `status_id` a 2 (Inactivo)
Y el camión desaparece de las búsquedas
Y no se puede asignar a nuevas cargas
