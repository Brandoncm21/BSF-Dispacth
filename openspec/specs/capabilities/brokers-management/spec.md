# Capability: Brokers Management

> Gestión de intermediarios (brokers): registro, edición, contactos múltiples y eliminación lógica.

---

### Requirement: Registrar un nuevo broker

Un usuario autorizado debe poder crear un nuevo broker.

#### Scenario: Creación exitosa de broker
GIVEN un usuario autenticado con rol de admin, back_office o sales
Y está en la página de brokers
WHAND abre el formulario de nuevo broker
Y ingresa first_name, last_name, email, phone_number
Y opcionalmente ingresa MC number y USDOT number
Y establece el estado (Activo, Pendiente, Inactivo)
Y confirma la creación
THEN el sistema guarda el broker en la base de datos
Y aparece en la lista de brokers

---

### Requirement: Editar un broker existente

Un usuario autorizado debe poder modificar los datos de un broker.

#### Scenario: Edición de broker
GIVEN un broker existente
Y un usuario con permisos de escritura
WHAND edita el email, teléfono o MC number
Y guarda los cambios
THEN el sistema actualiza el broker

---

### Requirement: Buscar brokers

Los usuarios deben poder buscar brokers por nombre o MC number.

#### Scenario: Búsqueda por nombre
GIVEN un usuario en la página de brokers
WHAND ingresa un término de búsqueda
THEN el sistema muestra brokers cuyo nombre o MC number coincidan
Y pagina los resultados de 16 en 16

---

### Requirement: Gestionar contactos de un broker

Un broker puede tener múltiples contactos asociados.

#### Scenario: Agregar contacto a broker
GIVEN un broker existente
Y un usuario autorizado
WHAND abre la pestaña de contactos del broker
Y agrega un nuevo contacto con nombre, email y teléfono
THEN el sistema guarda el contacto en `broker_contacts`
Y aparece en la lista de contactos del broker

#### Scenario: Eliminar contacto de broker
GIVEN un broker con contactos existentes
Y un usuario autorizado
WHAND selecciona eliminar un contacto
THEN el sistema elimina el contacto de `broker_contacts`

#### Scenario: Designar contacto principal
GIVEN un broker con múltiples contactos
Y un usuario autorizado
WHAND selecciona "Marcar como principal" en un contacto
THEN el sistema establece `is_primary = true` para ese contacto
Y establece `is_primary = false` para todos los demás contactos del mismo broker

---

### Requirement: Ver detalles de un broker

El sistema debe mostrar información detallada de cada broker.

#### Scenario: Vista de detalle con pestañas
GIVEN un usuario en la lista de brokers
WHAND hace clic en un broker
THEN se abre una vista de detalle con pestañas:
  - Información general (datos básicos, MC, USDOT, estado)
  - Contactos (lista con opción de agregar, eliminar y marcar principal)

---

### Requirement: Eliminar un broker (soft delete)

Un usuario autorizado debe poder desactivar un broker.

#### Scenario: Desactivación de broker
GIVEN un broker activo
Y un usuario con permisos de admin
WHAND selecciona eliminar el broker
THEN el sistema cambia `status_id` a 2 (Inactivo)
Y el broker desaparece de las búsquedas
Y no se puede asignar a nuevas ventas
