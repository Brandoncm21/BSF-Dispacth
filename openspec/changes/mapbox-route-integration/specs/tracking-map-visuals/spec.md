# Spec: Tracking Map Visuals

## Context

All tracking maps (`/traceability`, Load Detail Modal "Mapa de Tracking" tab) currently render only checkpoint markers and a route line between them. They lack visual differentiation of origin, destination, and intermediate stops (waypoints). This spec adds mandatory visual markers for these elements using distinct shapes and colors.

## NEW Requirements

### Requirement: Map MUST render origin marker (green flag)

- `SHALL-MAP-VIS-01`: All tracking maps MUST render an **origin marker** at the route's starting location.
- `SHALL-MAP-VIS-01a`: The origin marker SHALL be rendered as a **green flag** (SVG element, color `#10b981`).
- `SHALL-MAP-VIS-01b`: The origin marker SHALL display the label "O" (Origen) when hovered.
- `SHALL-MAP-VIS-01c`: Clicking the origin marker SHALL open a popup showing "Origen" and the origin address (`locations.formatted_address`).

#### Scenario: Origin marker appears on traceability map
- **GIVEN** the dispatcher is on `/traceability` page
- **AND** there are active loads with routes
- **WHEN** the map loads
- **THEN** each active load's origin is marked with a green flag marker

#### Scenario: Origin marker appears in Load Detail Modal tracking tab
- **GIVEN** the user opens the Load Detail Modal for a load with a route
- **WHEN** the "Mapa de Tracking" tab is active
- **THEN** the route origin is marked with a green flag marker

### Requirement: Map MUST render destination marker (red pin)

- `SHALL-MAP-VIS-02`: All tracking maps MUST render a **destination marker** at the route's ending location.
- `SHALL-MAP-VIS-02a`: The destination marker SHALL be rendered as a **red pin** (SVG element, color `#ef4444`).
- `SHALL-MAP-VIS-02b`: The destination marker SHALL display the label "D" (Destino) when hovered.
- `SHALL-MAP-VIS-02c`: Clicking the destination marker SHALL open a popup showing "Destino" and the destination address.

### Requirement: Map MUST render waypoint markers

- `SHALL-MAP-VIS-03`: If the route has waypoints (`routes.waypoints` JSONB array is non-empty), the map MUST render intermediate stop markers.
- `SHALL-MAP-VIS-03a`: Waypoint markers SHALL be rendered as **small blue dots** (color `#3b82f6`).
- `SHALL-MAP-VIS-03b`: Each waypoint marker SHALL open a popup showing:
  - Type: "Pickup" or "Delivery"
  - Address: the waypoint's `formatted_address`
  - Sequence number: "Parada #N"
- `SHALL-MAP-VIS-03c`: Waypoints SHALL be numbered in sequence order (1, 2, 3...) based on the `sequence` field.

#### Scenario: Waypoints appear as intermediate stops
- **GIVEN** a route has 3 waypoints (2 pickups, 1 delivery)
- **WHEN** the map renders
- **THEN** 2 pickup waypoints appear as blue dots between origin and destination
- **AND** 1 delivery waypoint appears as a blue dot
- **AND** each dot shows the correct type and sequence number in its popup

### Requirement: Route line MUST follow real roads (Mapbox Directions API)

- `SHALL-MAP-VIS-04`: The route line MUST use **Mapbox Directions API** (`mapbox/driving` profile, `overview=full`) to obtain real road geometry (polyline), NOT a straight Euclidean LineString.
- `SHALL-MAP-VIS-04a`: The API call SHALL include all coordinates in sequence: origin → waypoint[0] → waypoint[N] → destination.
- `SHALL-MAP-VIS-04b`: The response geometry (`GeoJSON LineString`) SHALL be passed to `TrackingMap` via the `routeGeometry` prop.
- `SHALL-MAP-VIS-04c`: The map SHALL render the route using `map.addSource({ type: "geojson" })` with the real road LineString.
- `SHALL-MAP-VIS-04d`: If `routeGeometry` is not available (API failure or missing coords), the map SHALL fall back to a direct LineString connecting available stops.
- `SHALL-MAP-VIS-04e`: Checkpoint markers remain drawn, but the planned route line (from Directions API) is the primary visual — NOT the checkpoint trail.

#### Scenario: Route drawn over real roads
- **GIVEN** a route from Houston to Dallas with waypoints in San Antonio and Austin
- **WHEN** the map renders
- **THEN** the route line follows Interstate highways (I-10, I-35) instead of straight lines
- **AND** the polyline geometry comes from Mapbox Directions API response

### Requirement: Missing coordinates MUST NOT break the map

- `SHALL-MAP-VIS-05`: If `lat`/`lng` is NULL for any location (origin, destination, or waypoint), the map MUST gracefully omit that marker without throwing errors.
- `SHALL-MAP-VIS-05a`: The route line SHALL skip missing coordinates and connect available ones.

### Requirement: FitBounds MUST include all rendered stops

- `SHALL-MAP-VIS-06`: After rendering all markers, `fitBounds` SHALL include origin, destination, and all waypoints that have valid coordinates.
- `SHALL-MAP-VIS-06a`: Padding SHALL be `{ padding: 60 }` with `maxZoom: 12`.

## REMOVED Requirements

N/A
