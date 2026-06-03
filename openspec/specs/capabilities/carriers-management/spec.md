# Capability: Carriers Management

> Gestión de empresas transportistas (carriers): registro, edición, búsqueda y eliminación lógica.

---

### Requirement: Registrar un nuevo carrier

Un usuario autorizado debe poder crear un nuevo carrier con sus datos legales y operativos.

#### Scenario: Creación exitosa de carrier
GIVEN un usuario autenticado con rol de admin o back_office
Y está en la página de carriers
WHAND abre el formulario de nuevo carrier
Y ingresa company_name, owner_name, dirección, teléfono, email
Y opcionalmente ingresa DOT, EIN, SSN, MC number, USDOT
Y establece el dispatch_fee_percent
Y confirma la creación
THEN el sistema guarda el carrier en la base de datos
Y aparece en la lista de carriers

---

### Requirement: Editar un carrier existente

Un usuario autorizado debe poder modificar los datos de un carrier.

#### Scenario: Edición de carrier
GIVEN un carrier existente
Y un usuario con permisos de escritura
WHAND edita el dispatch_fee_percent o los datos de contacto
Y guarda los cambios
THEN el sistema actualiza el carrier
Y las cargas futuras usarán el nuevo dispatch_fee_percent

---

### Requirement: Buscar carriers

Los usuarios deben poder buscar carriers por nombre o MC number.

#### Scenario: Búsqueda por nombre
GIVEN un usuario en la página de carriers
WHAND ingresa un término de búsqueda
THEN el sistema muestra carriers cuyo company_name o MC number coincidan
Y pagina los resultados de 16 en 16

---

### Requirement: Ver detalles legales de un carrier

El sistema debe mostrar información detallada y legal de cada carrier.

#### Scenario: Expansión de fila para detalles
GIVEN un usuario en la tabla de carriers
WHAND hace clic en una fila para expandir
THEN se muestran los detalles legales: DOT number, EIN, SSN, dirección completa, email, teléfono, factoring, dispatch fee %

---

### Requirement: Eliminar un carrier (soft delete)

Un usuario autorizado debe poder desactivar un carrier sin borrarlo.

#### Scenario: Desactivación de carrier
GIVEN un carrier activo
Y un usuario con permisos de admin
WHAND selecciona eliminar el carrier
THEN el sistema cambia `status_id` a 2 (Inactivo)
Y el carrier desaparece de las búsquedas
Y no se puede asignar a nuevas cargas

---

### Requirement: Obtener dispatch fee de un carrier

El sistema debe poder consultar el porcentaje de comisión de un carrier.

#### Scenario: Consulta de dispatch fee
GIVEN un carrier existente con dispatch_fee_percent = 0.05
WHAND el sistema necesita calcular el dispatch fee de una carga
THEN consulta el carrier vía RPC `get_carrier_dispatch_fee`
Y devuelve 0.05 (5%)
