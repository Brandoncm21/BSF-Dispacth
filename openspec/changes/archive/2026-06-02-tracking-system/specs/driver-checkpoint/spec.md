## ADDED Requirements

### Requirement: Driver SHALL report checkpoint during active load
The system SHALL allow the driver to report their current position at any time while the load is in progress

#### Scenario: Driver reports position with success
- **GIVEN** the driver has an active load in status `picked_up` or `booked`
- **WHEN** the driver submits their current latitude, longitude, and an optional note
- **THEN** the system creates a checkpoint record with timestamp and status
- **AND** the system broadcasts the checkpoint to the assigned dispatcher via Realtime

#### Scenario: Driver reports delivery at destination
- **GIVEN** the driver has an active load in status `picked_up`
- **WHEN** the driver submits a checkpoint with status `delivered` and their current position
- **THEN** the system creates the checkpoint record
- **AND** the system automatically transitions the load to `delivered`
- **AND** the system broadcasts the delivery event to the dispatcher

#### Scenario: Driver cannot report checkpoint without active load
- **GIVEN** the driver has no active load
- **WHEN** the driver attempts to submit a checkpoint
- **THEN** the system returns an error: "No tienes una carga activa"

#### Scenario: Driver reports status transition pickup
- **GIVEN** the driver has a load in status `booked`
- **WHEN** the driver submits a checkpoint with status `picked_up` and their current position
- **THEN** the system creates the checkpoint record
- **AND** the system automatically transitions the load to `picked_up`
- **AND** the system broadcasts the pickup event to the dispatcher

## MODIFIED Requirements

<!-- No existing specs to modify -->

## REMOVED Requirements

<!-- No removed requirements -->
