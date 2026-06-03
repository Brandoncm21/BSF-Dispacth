# Capability: Loads Management

> Gestión completa del ciclo de vida de una carga (load): creación, edición, seguimiento de estados, documentos y eliminación lógica.

---

### Requirement: Crear una nueva carga

Un dispatcher o admin debe poder registrar una nueva carga con todos sus datos asociados.

#### Scenario: Creación exitosa de carga
GIVEN un usuario autenticado con rol de dispatcher
Y está en la página de cargas
WHEN abre el formulario de nueva carga
Y selecciona carrier, driver, truck y ruta válidos
Y ingresa los datos de la carga (rate, dispatch fee %, fechas, etc.)
Y confirma la creación
THEN el sistema crea la carga en la base de datos
Y genera automáticamente un `load_number` único (formato `LD-YYYY-NNNN`)
Y registra el estado inicial "pending" en `load_status_history`
Y muestra la nueva carga en la lista

#### Scenario: Validación de campos obligatorios
GIVEN un usuario autenticado
WHAND intenta crear una carga sin seleccionar carrier, driver, truck o ruta
THEN el sistema muestra mensajes de error de validación (Zod)
Y no permite la creación hasta completar los campos requeridos

---

### Requirement: Editar una carga existente

Un dispatcher asignado o admin debe poder modificar los datos de una carga.

#### Scenario: Edición exitosa
GIVEN una carga existente con estado "pending"
Y un usuario con permisos sobre esa carga
WHEN edita el rate, el truck asignado o las fechas
Y guarda los cambios
THEN el sistema actualiza los datos en la base de datos
Y mantiene el historial de cambios de estado si aplica

---

### Requirement: Cambiar el estado de una carga

El sistema debe permitir transicionar una carga por los estados definidos y auditar cada cambio.

#### Scenario: Transición de estado
GIVEN una carga con estado "booked"
Y un usuario autorizado
WHEN cambia el estado a "picked_up"
THEN el sistema actualiza el estado de la carga
Y registra la transición en `load_status_history` con old_status, new_status, changed_by y timestamp
Y si el nuevo estado es "picked_up" o "delivered", actualiza `picked_up_at` o `delivered_at`

#### Scenario: Selector inline de estado en tabla
GIVEN un usuario en la página de cargas
WHAND ve la tabla de cargas
THEN puede cambiar el estado de una carga directamente desde un selector inline en la tabla
Y el cambio se registra automáticamente con auditoría

---

### Requirement: Eliminar una carga (soft delete)

Un usuario autorizado debe poder "eliminar" una carga sin borrarla físicamente de la base de datos.

#### Scenario: Eliminación lógica
GIVEN una carga existente
Y un usuario con permisos de admin o dispatcher asignado
WHAND selecciona eliminar la carga
THEN el sistema cambia `status_id` a 2 (Inactivo)
Y la carga desaparece de las búsquedas y listados
Y los datos permanecen en la base de datos para referencia histórica

---

### Requirement: Adjuntar documentos a una carga

El sistema debe permitir subir documentos PDF relacionados con una carga.

#### Scenario: Subir documento RC o BOL
GIVEN una carga existente
Y un usuario autorizado
WHAND adjunta un archivo PDF de tipo RC o BOL
THEN el sistema valida que el archivo sea PDF y no exceda 5MB
Y sube el archivo al bucket `load_documents` de Supabase Storage
Y guarda los metadatos en la tabla `load_documents`

#### Scenario: Ver documentos adjuntos
GIVEN una carga con documentos adjuntos
WHAND el usuario abre el diálogo de documentos
THEN el sistema muestra la lista de documentos con nombre, tipo y fecha de subida
Y permite ver el PDF en una nueva pestaña mediante URL firmada (1 hora)

#### Scenario: Eliminar documento adjunto
GIVEN una carga con documentos adjuntos
Y un usuario con permisos de admin o dispatcher asignado
WHAND selecciona eliminar un documento
THEN el sistema elimina el archivo de Supabase Storage
Y elimina el registro de metadatos de la base de datos

---

### Requirement: Búsqueda y filtrado de cargas

Los usuarios deben poder buscar y filtrar cargas en la lista.

#### Scenario: Búsqueda por número o descripción
GIVEN un usuario en la página de cargas
WHAND ingresa un término de búsqueda en el campo de búsqueda
THEN el sistema filtra las cargas que coincidan con el número de carga o descripción
Y muestra los resultados paginados

#### Scenario: Filtrar por estado
GIVEN un usuario en la página de cargas
WHAND selecciona un estado (Pending, Booked, Picked Up, Delivered, Paid)
THEN el sistema filtra solo las cargas con ese estado
Y actualiza la lista y el conteo total

---

### Requirement: Paginación de cargas

La lista de cargas debe mostrarse paginada para mejorar el rendimiento.

#### Scenario: Navegación por páginas
GIVEN una lista de cargas con más de 16 registros
WHEN el usuario está en la página de cargas
THEN se muestran 16 cargas por página
Y hay controles de paginación para ir a la página anterior o siguiente
Y se muestra el total de registros y el rango actual
