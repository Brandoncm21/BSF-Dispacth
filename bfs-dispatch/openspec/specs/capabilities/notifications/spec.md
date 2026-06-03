# Capability: Notifications

> Sistema de notificaciones in-app persistentes con actualización en tiempo real.

---

### Requirement: Recibir notificaciones en tiempo real

El sistema debe notificar a los usuarios sobre eventos relevantes en tiempo real.

#### Scenario: Notificación de nuevo checkpoint
GIVEN un dispatcher autenticado
Y un chofer reporta un checkpoint para una carga asignada a ese dispatcher
WHAND el chofer confirma el reporte
THEN el sistema crea una notificación en la tabla `notifications`
Y hace broadcast vía Supabase Realtime al canal del dispatcher
Y la campana de notificaciones (`NotificationBell`) muestra el contador incrementado
Y aparece un toast o alerta en pantalla

#### Scenario: Notificación de cambio de estado de carga
GIVEN un dispatcher autenticado
Y una carga asignada a ese dispatcher cambia de estado
WHAND el estado cambia (ej: de "booked" a "picked_up")
THEN el sistema crea una notificación
Y el dispatcher la recibe en tiempo real vía WebSocket

---

### Requirement: Ver lista de notificaciones

Los usuarios deben poder ver todas sus notificaciones.

#### Scenario: Lista desplegable de notificaciones
GIVEN un usuario autenticado
WHAND hace clic en la campana de notificaciones en el Header
THEN se muestra un panel desplegable con las últimas notificaciones
Y cada notificación muestra: título, mensaje, fecha y estado (leída/no leída)
Y las notificaciones no leídas están resaltadas

#### Scenario: Cargar más notificaciones
GIVEN un usuario con muchas notificaciones
WHAND scrollea en el panel desplegable
THEN el sistema carga más notificaciones paginadas

---

### Requirement: Marcar notificaciones como leídas

Los usuarios deben poder gestionar el estado de lectura de sus notificaciones.

#### Scenario: Marcar una notificación como leída
GIVEN un usuario en el panel de notificaciones
WHAND hace clic en una notificación no leída
THEN el sistema marca `is_read = true`
Y el contador de no leídas disminuye en 1
Y la notificación ya no aparece resaltada

#### Scenario: Marcar todas como leídas
GIVEN un usuario con múltiples notificaciones no leídas
WHAND hace clic en "Marcar todas como leídas"
THEN el sistema marca todas las notificaciones del usuario como leídas
Y el contador de no leídas se resetea a 0

---

### Requirement: Notificaciones persistentes

Las notificaciones deben sobrevivir a recargas de página y nuevas sesiones.

#### Scenario: Persistencia tras recarga
GIVEN un usuario con notificaciones no leídas
WHAND recarga la página
THEN el sistema consulta la tabla `notifications` al cargar
Y muestra el contador exacto de no leídas
Y mantiene el historial completo de notificaciones

---

### Requirement: Preferencias de notificación (preparado)

El sistema tiene preparada la estructura para preferencias de notificación.

#### Scenario: Estructura de preferencias
GIVEN la tabla `notification_preferences` existe
WHAND se implemente la gestión de preferencias
THEN cada usuario podrá habilitar/deshabilitar tipos de notificación específicos
