# Spec: Truck Fuel Configuration

## Requirement Headers

- `SHALL-TRUCK-FUEL-01`: The truck form sheet MUST include a `fuel_type` selector with options "Diesel" and "Gasolina".
- `SHALL-TRUCK-FUEL-02`: The truck form sheet MUST include a `fuel_cost_per_mile` numeric input with a default of 0.60.
- `SHALL-TRUCK-FUEL-03`: The `search_trucks` RPC MUST return `fuel_type` and `fuel_cost_per_mile` fields.
- `SHALL-TRUCK-FUEL-04`: The trucks table view MUST display `fuel_type` and `fuel_cost_per_mile` columns.
- `SHALL-TRUCK-FUEL-05`: The trucks card view MUST display `fuel_type` and `fuel_cost_per_mile` details.
- `SHALL-TRUCK-FUEL-06`: The `createTruck` server action MUST accept `fuel_type` and `fuel_cost_per_mile`.
- `SHALL-TRUCK-FUEL-07`: The `updateTruck` server action MUST accept `fuel_type` and `fuel_cost_per_mile`.
- `SHALL-TRUCK-FUEL-08`: The `TruckWithSmartStatus` type MUST include `fuel_type` and `fuel_cost_per_mile`.

## Gherkin Scenarios

```gherkin
Feature: Truck Fuel Configuration

  Scenario: Admin creates a truck with diesel fuel
    Given the admin is on the truck form sheet
    When they select "Diesel" from the fuel type dropdown
    And they enter "0.55" in fuel cost per mile
    And they submit the form
    Then the truck is created with fuel_type = "diesel" and fuel_cost_per_mile = 0.55

  Scenario: Admin edits fuel config on existing truck
    Given an existing truck with fuel_type = null
    When the admin opens the truck edit form
    And changes fuel_type to "Gasolina"
    And sets fuel_cost_per_mile to "0.65"
    And saves
    Then the truck is updated with fuel_type = "gasoline" and fuel_cost_per_mile = 0.65

  Scenario: Fuel info visible in trucks table
    Given there are trucks with fuel_type configured
    When the trucks page renders in table view
    Then each row shows the fuel_type and fuel_cost_per_mile

  Scenario: Fuel info visible in trucks cards
    Given there are trucks with fuel_type configured
    When the trucks page renders in card view
    Then each card shows the fuel_type and fuel_cost_per_mile
```
