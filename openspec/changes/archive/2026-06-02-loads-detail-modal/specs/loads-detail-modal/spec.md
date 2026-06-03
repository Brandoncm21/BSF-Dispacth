# Spec: Load Detail Modal

## Requirement Headers

- `SHALL-MODAL-01`: The loads table SHALL replace the "Ver documentos" button with a "Detalles" button using an Eye icon (👁️ or `Eye` lucide icon).
- `SHALL-MODAL-02`: Clicking the "Detalles" button SHALL open a unified modal dialog.
- `SHALL-MODAL-03`: The modal SHALL contain exactly three tabs: "Información General", "Documentos Adjuntos", "Mapa de Tracking".
- `SHALL-MODAL-04`: The "Información General" tab SHALL display: load_number, carrier_name, driver_name, unit_number, cargo_type_name, miles, rate, dispatch_fee_pct, load_status, picked_up_at, delivered_at, and a notes field.
- `SHALL-MODAL-05`: The "Documentos Adjuntos" tab SHALL display the existing document list (RC/BOL) with download and upload capabilities.
- `SHALL-MODAL-06`: The "Mapa de Tracking" tab SHALL render a Mapbox map with the load's checkpoint history.
- `SHALL-MODAL-07`: The checkpoint history SHALL be drawn as a blue polyline (LineString) connecting all checkpoints in chronological order.
- `SHALL-MODAL-08`: Each checkpoint SHALL have a circular marker on the map.
- `SHALL-MODAL-09`: The most recent checkpoint SHALL be highlighted with a colored marker and an open popup showing: checkpoint status, notes, and recorded_at timestamp.
- `SHALL-MODAL-10`: The map SHALL fit the bounds of all checkpoints with padding.
- `SHALL-MODAL-11`: The map SHALL load lazily with `dynamic()` and `ssr: false`.

## Gherkin Scenarios

```gherkin
Feature: Load Detail Modal

  Scenario: Open modal from loads table
    Given the loads table is rendered
    When the user clicks the "Detalles" button on a load row
    Then a modal opens with title "Detalles de Carga #<load_number>"
    And the first tab "Información General" is active

  Scenario: Información General tab shows all fields
    Given the load detail modal is open
    When the user views the "Información General" tab
    Then they see: load_number, carrier, driver, truck, cargo, miles
    And they see: rate, dispatch_fee_pct, $/mile, status, pickup, delivery
    And they see any additional notes for the load

  Scenario: Documentos Adjuntos tab shows files
    Given the load detail modal is open
    When the user clicks the "Documentos Adjuntos" tab
    Then they see any uploaded RC and BOL documents
    And they can download or upload new documents

  Scenario: Mapa de Tracking tab shows checkpoint route
    Given the load has checkpoints in driver_checkpoints
    When the user clicks the "Mapa de Tracking" tab
    Then a Mapbox map renders with a blue line connecting checkpoints
    And the most recent checkpoint is highlighted with a popup

  Scenario: Modal closes
    Given the load detail modal is open
    When the user clicks the X button or outside the modal
    Then the modal closes
```
