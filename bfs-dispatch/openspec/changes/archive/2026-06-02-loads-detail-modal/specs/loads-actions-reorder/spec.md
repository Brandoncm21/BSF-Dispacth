# Spec: Loads Actions Reorder

## Requirement Headers

- `SHALL-ACTIONS-01`: The loads table actions column SHALL have buttons in this exact order: Detalles, Reportar, Editar, Eliminar.
- `SHALL-ACTIONS-02`: The "Reportar Ubicación" button SHALL only be visible for loads with `load_status` of `booked` or `picked_up` AND a non-null `driver_id`.
- `SHALL-ACTIONS-03`: The "Reportar Ubicación" button SHALL use the `MapPin` icon colored green.
- `SHALL-ACTIONS-04`: The "Detalles" button SHALL use the `Eye` icon.
- `SHALL-ACTIONS-05`: The "Editar" button SHALL use the `Edit2` icon.
- `SHALL-ACTIONS-06`: The "Eliminar" button SHALL use the `Trash2` icon.

## Gherkin Scenarios

```gherkin
Feature: Loads Actions Reorder

  Scenario: Actions appear in correct order
    Given a load is displayed in the loads table
    When the actions column is rendered
    Then the buttons appear in order: Detalles, Reportar (if active), Editar, Eliminar

  Scenario: Reportar button conditional visibility
    Given a load with load_status = 'booked' and driver_id is set
    When the actions column is rendered
    Then the Reportar button is visible and enabled

    Given a load with load_status = 'delivered'
    When the actions column is rendered
    Then the Reportar button is NOT visible
```
