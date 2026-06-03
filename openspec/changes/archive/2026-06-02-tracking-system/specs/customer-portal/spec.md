## ADDED Requirements

### Requirement: Shipper SHALL view load progress via public tracking URL
The system MUST provide a public tracking page for shippers and brokers to view their load's progress without authentication

#### Scenario: Shipper opens tracking URL with valid token
- **GIVEN** a shipper has received a tracking URL (e.g., `/track/a1b2c3d4-e5f6-...`)
- **WHEN** they open the URL in a browser
- **THEN** a public page displays without requiring login
- **AND** the page shows: load number, status, origin city/state, destination city/state, driver name
- **AND** a simple progress bar shows the current status stage (pending → booked → picked_up → delivered)

#### Scenario: Tracking URL shows Mapbox map with checkpoint history
- **GIVEN** the shipper is viewing the tracking page for a load that has checkpoints
- **WHEN** the page loads
- **THEN** a small Mapbox map renders showing all checkpoint pins along the route
- **AND** the expected origin and destination are marked with different styled pins

#### Scenario: Invalid tracking token shows error
- **GIVEN** someone opens a tracking URL with an invalid or expired token
- **WHEN** the page loads
- **THEN** the system returns a user-friendly error: "Enlace de rastreo no válido o expirado"
- **AND** the page provides instructions to contact support

#### Scenario: Completed load shows delivery confirmation on tracking page
- **GIVEN** a load has been marked as `delivered`
- **WHEN** the shipper views the tracking page
- **THEN** the page shows a "¡Entregado!" banner with the delivery timestamp
- **AND** the final checkpoint location is highlighted on the map

#### Scenario: Load with no checkpoints shows route info only
- **GIVEN** a load has been assigned but no driver checkpoints have been submitted yet
- **WHEN** the shipper opens the tracking URL
- **THEN** the page shows the planned origin, destination, and load status
- **AND** a message explains: "El chofer aún no ha comenzado el viaje"

## MODIFIED Requirements

<!-- No existing specs to modify -->

## REMOVED Requirements

<!-- No removed requirements -->
