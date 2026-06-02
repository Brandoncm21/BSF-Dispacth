## ADDED Requirements

### Requirement: Dispatcher SHALL view live positions on Mapbox map
The system SHALL display the last reported position of every in-route truck on a Mapbox map to the dispatcher

#### Scenario: Map shows pins for all trucks in route
- **GIVEN** the dispatcher is on the `/traceability` page
- **WHEN** the page loads
- **THEN** the system fetches the latest checkpoint for each load with status `booked` or `picked_up`
- **AND** the system renders a Mapbox map with colored markers for each truck
- **AND** each marker shows the truck's `unit_number`, `load_number`, and last reported time in a popup

#### Scenario: Marker color indicates checkpoint recency
- **GIVEN** the map shows multiple truck markers
- **WHEN** a truck has reported within the last 2 hours
- **THEN** its marker is colored green
- **WHEN** a truck has not reported in 2–12 hours
- **THEN** its marker is colored amber
- **WHEN** a truck has not reported in over 12 hours
- **THEN** its marker is colored red
- **AND** the system flags it as a potential delay

#### Scenario: Map updates in real-time when new checkpoint arrives
- **GIVEN** the dispatcher is viewing the map
- **WHEN** a new checkpoint is broadcast via Realtime
- **THEN** the corresponding truck marker updates position on the map without page refresh
- **AND** the marker briefly animates to draw attention

#### Scenario: Dispatcher views checkpoint history for a load
- **GIVEN** the dispatcher clicks on a truck marker
- **WHEN** the popup displays
- **THEN** the popup contains a link to view the full checkpoint history for that load
- **AND** the history shows all checkpoints sorted by time with map location pins

## MODIFIED Requirements

<!-- No existing specs to modify -->

## REMOVED Requirements

<!-- No removed requirements -->
