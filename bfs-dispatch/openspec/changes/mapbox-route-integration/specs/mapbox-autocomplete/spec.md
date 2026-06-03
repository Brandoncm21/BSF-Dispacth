## ADDED Requirements

### Requirement: Buscar direcciones con Mapbox Autocomplete

El sistema debe permitir buscar direcciones reales usando Mapbox Places API con sugerencias en tiempo real.

#### Scenario: Autocomplete de dirección de origen
GIVEN un usuario en el formulario de Nueva Ruta
WHAND hace clic en el campo "Dirección de Origen"
Y escribe "123 Main St"
THEN el sistema consulta la API de Mapbox Places
Y muestra una lista de sugerencias: "123 Main St, Houston, TX", "123 Main St, Dallas, TX", etc.
Y cada sugerencia muestra la dirección formateada completa

#### Scenario: Seleccionar sugerencia de Mapbox
GIVEN una lista de sugerencias de Mapbox
WHAND el usuario hace clic en "123 Main St, Houston, TX 77001"
THEN el sistema extrae y guarda:
  - formatted_address: "123 Main St, Houston, TX 77001"
  - street: "123 Main St"
  - city: "Houston"
  - state: "TX"
  - zip: "77001"
  - lat: 29.7604
  - lng: -95.3698
  - mapbox_place_id: "place.abc123"
Y el campo muestra la dirección seleccionada

### Requirement: Reutilizar direcciones existentes

Si una dirección ya fue guardada previamente, el sistema debe reutilizar el registro.

#### Scenario: Dirección duplicada
GIVEN que "123 Main St, Houston, TX 77001" ya existe en `locations` con mapbox_place_id = "place.abc123"
WHAND el usuario busca y selecciona esa misma dirección
THEN el sistema detecta el place_id duplicado
Y reutiliza el `location_id` existente
Y no crea un registro duplicado
