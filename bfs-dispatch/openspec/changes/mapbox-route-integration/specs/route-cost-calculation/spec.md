## ADDED Requirements

### Requirement: Calcular distancia automáticamente

Al seleccionar origen y destino, el sistema debe calcular la distancia en millas automáticamente.

#### Scenario: Cálculo de distancia con coordenadas exactas
GIVEN un origen seleccionado con lat=29.7604, lng=-95.3698
Y un destino seleccionado con lat=32.7767, lng=-96.7970
WHAND ambos están seleccionados
THEN el sistema consulta Mapbox Directions API con perfil `mapbox/driving` y parámetro `overview=full`
Y calcula la distancia de conducción real en millas (no euclidiana)
Y retorna la geometría GeoJSON LineString para dibujar la ruta sobre carreteras reales
Y muestra el resultado en el formulario: "Distancia: 240.5 millas"

### Requirement: Calcular distancia con waypoints

Cuando una ruta tiene paradas intermedias, la distancia debe calcularse incluyendo los desvíos por waypoints.

#### Scenario: Distancia con waypoints
GIVEN un origen en Houston, 2 waypoints (San Antonio, Austin), y un destino en Dallas
WHAND los waypoints están configurados
THEN la URL de Directions API incluye todas las coordenadas en secuencia: `origin;waypoint1;waypoint2;destination`
Y la distancia total refleja el recorrido real por carretera incluyendo los desvíos
Y la geometría LineString cubre toda la ruta origen→waypoint1→waypoint2→destino

### Requirement: Mostrar costo estimado de combustible

El sistema debe calcular y mostrar el costo estimado de combustible basado en la distancia.

#### Scenario: Costo de combustible
GIVEN una distancia calculada de 240.5 millas
Y un camión seleccionado con fuel_cost_per_mile = 0.65
WHAND ambos valores están disponibles
THEN el sistema calcula: 240.5 × 0.65 = $156.33
Y muestra un panel informativo con: Millas, Tipo de combustible, $/mi, Total Estimado

### Requirement: Mostrar rate por milla como dato informativo

Después de que el usuario ingresa el rate manualmente, el sistema debe calcular y mostrar el rate por milla.

#### Scenario: Rate por milla informativo
GIVEN una distancia de 240.5 millas
Y un usuario que ingresa rate = $1,200
WHAND el rate está ingresado y la distancia calculada
THEN el sistema calcula: 1200 ÷ 240.5 = $4.99/milla
Y muestra el rate por milla en el formulario como dato informativo
Y no modifica ni sugiere el rate automáticamente
