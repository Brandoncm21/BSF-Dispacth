# Capability: Route Management

> Gestión de rutas: creación de direcciones, ciudades, calles y cálculo de distancias en millas.

---

### Requirement: Crear una nueva ruta

El sistema debe permitir definir rutas con origen, destino y distancia en millas.

#### Scenario: Creación de ruta en 3 pasos
GIVEN un usuario autenticado con rol adecuado
Y está creando una carga o abriendo el modal de nueva ruta
WHAND inicia la creación de ruta
THEN se muestra un modal de 3 pasos:
  - Paso 1: Seleccionar/crear dirección de origen (estado, ciudad, calle)
  - Paso 2: Seleccionar/crear dirección de destino (estado, ciudad, calle)
  - Paso 3: Confirmar y calcular distancia en millas
Y al confirmar, el sistema crea la ruta y la asocia a la carga

---

### Requirement: Upsert de direcciones (get-or-create)

El sistema debe reutilizar direcciones existentes o crear nuevas automáticamente.

#### Scenario: Reutilizar ciudad existente
GIVEN una ciudad "Houston" en el estado de Texas ya existe en la base de datos
WHAND el usuario crea una nueva dirección en Houston
THEN el sistema detecta que la ciudad existe
Y reutiliza el `city_id` existente
Y no crea duplicados

#### Scenario: Crear nueva ciudad
GIVEN una ciudad que no existe en la base de datos
WHAND el usuario ingresa el nombre de la ciudad
THEN el sistema la crea automáticamente vía RPC `get_or_create_city`
Y la vincula al estado seleccionado

#### Scenario: Upsert de calle
GIVEN una calle que puede o no existir
WHAND el usuario ingresa el nombre de la calle
THEN el sistema busca la calle en la ciudad seleccionada
Y si existe, reutiliza el `street_id`
Y si no existe, la crea vía RPC `get_or_create_street`

---

### Requirement: Creación atómica de ruta completa

El sistema debe crear rutas de forma atómica para evitar inconsistencias.

#### Scenario: Transacción de ruta
GIVEN un usuario confirmando una nueva ruta
WHAND el usuario presiona "Guardar"
THEN el sistema ejecuta `create_route_full` en una transacción PostgreSQL
Y crea las direcciones de origen y destino si no existen
Y crea la ruta con `origin_address_id` y `destination_address_id`
Y calcula y guarda las millas estimadas
Y si cualquier paso falla, se hace rollback completo

---

### Requirement: Buscar calles existentes

El sistema debe permitir buscar calles ya registradas para reutilizarlas.

#### Scenario: Autocompletado de calles
GIVEN un usuario en el formulario de dirección
WHAND empieza a escribir el nombre de una calle
THEN el sistema busca calles coincidentes vía `searchStreets`
Y muestra sugerencias con el nombre de la calle, ciudad y estado
Y al seleccionar una, completa los campos automáticamente
