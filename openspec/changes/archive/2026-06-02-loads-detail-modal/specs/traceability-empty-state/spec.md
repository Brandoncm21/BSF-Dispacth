# Spec: Traceability Empty State

## Requirement Headers

- `SHALL-TRACE-EMPTY-01`: The `/traceability` page SHALL always render a map container section with a title "Mapa de Tracking".
- `SHALL-TRACE-EMPTY-02`: When there are trucks with `availability_status = 'en_ruta'` and at least one checkpoint, the container SHALL render the TrackingMap with markers.
- `SHALL-TRACE-EMPTY-03`: When there are NO trucks en_ruta with checkpoints, the container SHALL display the message "Ningún camión en ruta" centered in the container area.
- `SHALL-TRACE-EMPTY-04`: The empty state container SHALL maintain a fixed height of 350px to prevent layout shift.

## Gherkin Scenarios

```gherkin
Feature: Traceability Empty State

  Scenario: Map renders with markers when trucks are en_ruta
    Given there are trucks with availability_status = 'en_ruta'
    And those trucks have checkpoints in driver_checkpoints
    When the traceability page loads
    Then the map container is visible with title "Mapa de Tracking"
    And the TrackingMap renders with colored markers

  Scenario: Map shows empty message when no trucks active
    Given there are NO trucks with availability_status = 'en_ruta'
    When the traceability page loads
    Then the map container is visible with title "Mapa de Tracking"
    And the container shows "Ningún camión en ruta"
    And the container has a fixed height of 350px
```
