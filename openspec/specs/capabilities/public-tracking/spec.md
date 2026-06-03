# Capability: Public Tracking

> Portal público de rastreo de cargas por token UUID sin requerir autenticación.

---

### Requirement: Rastrear una carga por token

Cualquier persona con un token válido debe poder ver el progreso de una carga.

#### Scenario: Tracking público exitoso
GIVEN un shipper o broker con una URL de tracking (ej: `/track/abc123-uuid`)
WHAND abre la URL en el navegador
THEN se muestra una página pública sin requerir login
Y muestra la información de la carga:
  - Número de carga (`load_number`)
  - Estado actual (pending, booked, picked_up, delivered, paid)
  - Barra de progreso visual del estado
  - Origen y destino de la ruta
  - Fechas estimadas de pickup y delivery

---

### Requirement: Ver mapa con checkpoints

El portal público debe mostrar un mapa con los checkpoints reportados.

#### Scenario: Mapa público de tracking
GIVEN una carga con checkpoints registrados
Y un usuario accediendo a `/track/[token]`
WHAND carga la página
THEN se muestra un mini-mapa Mapbox con:
  - Marcador de origen
  - Marcador de destino
  - Línea de ruta entre origen y destino
  - Marcadores de checkpoints en orden cronológico
Y al hacer clic en un checkpoint se muestra la fecha, hora y notas

---

### Requirement: Timeline de tracking

El portal debe mostrar un timeline con el historial de la carga.

#### Scenario: Timeline público
GIVEN una carga con historial de estados y checkpoints
Y un usuario en el portal de tracking
WHAND carga la página
THEN se muestra una línea de tiempo vertical con:
  - Estados de la carga (booked, picked_up, delivered)
  - Checkpoints reportados con fecha, hora, ubicación y notas
  - Orden cronológico de más antiguo a más reciente

---

### Requirement: Token no válido

El sistema debe manejar tokens inválidos o expirados de forma graceful.

#### Scenario: Token no encontrado
GIVEN un usuario accediendo a `/track/token-invalido`
WHAND el token no corresponde a ninguna carga
THEN el sistema muestra un mensaje indicando que la carga no fue encontrada
Y sugiere verificar el enlace

---

### Requirement: Privacidad del tracking público

El portal público debe mostrar solo información no sensible.

#### Scenario: Sin información de PII
GIVEN un usuario accediendo al tracking público
WHAND ve los detalles de la carga
THEN solo muestra: load_number, estado, origen, destino, fechas, checkpoints
Y NO muestra: rate, dispatch fee, nombre del dispatcher, datos personales del chofer
