# Capability: Drivers Management

> Gestión de conductores: registro, edición, asignación a carrier, indicador TWIC y eliminación lógica.

---

### Requirement: Registrar un nuevo driver

Un usuario autorizado debe poder crear un nuevo conductor.

#### Scenario: Creación exitosa de driver
GIVEN un usuario autenticado con rol de admin o back_office
Y está en la página de drivers
WHAND abre el formulario de nuevo driver
Y ingresa first_name, last_name, phone_number, license_type, cdl_number
Y indica si tiene TWIC card
Y selecciona un carrier asignado
Y confirma la creación
THEN el sistema guarda el driver en la base de datos
Y aparece en la lista de drivers

---

### Requirement: Editar un driver existente

Un usuario autorizado debe poder modificar los datos de un conductor.

#### Scenario: Edición de driver
GIVEN un driver existente
Y un usuario con permisos de escritura
WHAND edita el carrier asignado o el número de licencia
Y guarda los cambios
THEN el sistema actualiza el driver
Y las cargas futuras reflejan el nuevo carrier si aplica

---

### Requirement: Buscar drivers

Los usuarios deben poder buscar conductores por nombre o carrier.

#### Scenario: Búsqueda por nombre
GIVEN un usuario en la página de drivers
WHAND ingresa un término de búsqueda
THEN el sistema muestra drivers cuyo nombre o carrier coincidan
Y pagina los resultados de 16 en 16

---

### Requirement: Ver historial de viajes de un driver

El sistema debe mostrar los últimos viajes realizados por un conductor.

#### Scenario: Panel lateral con últimos viajes
GIVEN un usuario en la página de drivers
WHAND selecciona un driver para ver detalles
THEN se muestra un panel lateral con los últimos 5 viajes realizados
Y cada viaje muestra load_number, fechas y estado

---

### Requirement: Indicador de TWIC card

El sistema debe indicar si un conductor posee tarjeta TWIC.

#### Scenario: Visualización de TWIC
GIVEN un driver con `has_twic_card = true`
WHAND se muestra en la tabla o detalle
THEN aparece un indicador visual (badge o ícono) de que posee TWIC

---

### Requirement: Eliminar un driver (soft delete)

Un usuario autorizado debe poder desactivar un conductor.

#### Scenario: Desactivación de driver
GIVEN un driver activo
Y un usuario con permisos de admin
WHAND selecciona eliminar el driver
THEN el sistema cambia `status_id` a 2 (Inactivo)
Y el driver desaparece de las búsquedas
Y no se puede asignar a nuevas cargas
