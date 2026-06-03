# Capability: Fleet Tracking

> Monitoreo de flota: overview, alertas, timeline por camión y seguimiento en tiempo real.

---

### Requirement: Ver overview de flota

El sistema debe mostrar un resumen del estado actual de la flota.

#### Scenario: Resumen de flota
GIVEN un usuario autenticado con rol de admin, back_office, dispatcher o logistics
Y está en la página de traceability
WHAND carga la página
THEN se muestra un resumen con:
  - Cantidad de camiones disponibles
  - Cantidad de camiones en ruta
  - Cantidad de camiones en mantenimiento

---

### Requirement: Ver alertas de flota

El sistema debe generar y mostrar alertas automáticas sobre la flota.

#### Scenario: Alertas de mantenimiento
GIVEN un camión con mantenimiento vencido o próximo
WHAND el usuario está en traceability
THEN aparece una alerta roja indicando el mantenimiento requerido
Y muestra el unit_number y tipo de mantenimiento

#### Scenario: Alertas de delays
GIVEN un camión que no ha reportado checkpoint en más de 48 horas
WHAND el usuario está en traceability
THEN aparece una alerta ámbar indicando el delay
Y muestra el unit_number y último checkpoint

#### Scenario: Alertas de disponibilidad
GIVEN un camión disponible sin carga asignada por más de 72 horas
WHAND el usuario está en traceability
THEN aparece una alerta verde sugerente de disponibilidad

---

### Requirement: Ver timeline de un camión

El sistema debe mostrar el historial de actividad de un camión específico.

#### Scenario: Timeline de historial
GIVEN un usuario en traceability
WHAND selecciona un camión de la lista
THEN se muestra una línea de tiempo con:
  - Historial de cargas de los últimos 30 días
  - Cambios de estado con fechas
  - Información del creador y último editor
Y se puede filtrar por load_number

---

### Requirement: Ver lista de flota agrupada

El sistema debe mostrar la flota organizada por carrier.

#### Scenario: Lista agrupada por carrier
GIVEN un usuario en traceability
WHAND visualiza la lista de flota
THEN los camiones se agrupan por carrier
Y cada grupo muestra el nombre del carrier y sus camiones
Y cada camión muestra su estado actual y carga asignada (si aplica)

---

### Requirement: Mapa de tracking con checkpoints

El sistema debe mostrar un mapa con la posición de los camiones en ruta.

#### Scenario: Mapa con marcadores de camiones
GIVEN camiones en ruta con checkpoints reportados
Y un usuario en traceability
WHAND carga el mapa
THEN se muestra un mapa Mapbox con marcadores para cada camión en ruta
Y el color del marcador indica la antigüedad del último checkpoint:
  - Verde: checkpoint en las últimas 4 horas
  - Ámbar: checkpoint entre 4 y 24 horas
  - Rojo: checkpoint hace más de 24 horas

#### Scenario: Línea de ruta en el mapa
GIVEN un camión en ruta con múltiples checkpoints
WHAND el usuario selecciona el camión en el mapa
THEN se dibuja una línea conectando los checkpoints en orden cronológico
Y se muestra el origen y destino de la ruta
