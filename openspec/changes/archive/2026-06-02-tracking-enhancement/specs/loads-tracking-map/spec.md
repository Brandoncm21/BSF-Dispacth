# Spec: Loads Interactive Tracking Map

## Requirement Headers

- `SHALL-LOADS-MAP-01`: The loads page MUST render a tab bar with "Lista" and "Mapa" tabs.
- `SHALL-LOADS-MAP-02`: The default active tab SHALL be "Lista" to preserve current behavior.
- `SHALL-LOADS-MAP-03`: Switching to the "Mapa" tab MUST render a Mapbox map with interactive markers.
- `SHALL-LOADS-MAP-04`: Each marker MUST represent a load with status `booked` or `picked_up` that has at least one checkpoint.
- `SHALL-LOADS-MAP-05`: Each marker SHALL be colored by checkpoint recency: green (< 2h), amber (2-12h), red (> 12h).
- `SHALL-LOADS-MAP-06`: Clicking a marker MUST open an interactive popup displaying: load_number, load_status, last checkpoint notes, driver_name, and a "Reportar Posición" action button.
- `SHALL-LOADS-MAP-07`: The map component MUST load lazily with `dynamic()` and `ssr: false`.
- `SHALL-LOADS-MAP-08`: The map MUST subscribe to Realtime channel `load-tracking:*` for live marker updates.
- `SHALL-LOADS-MAP-09`: The map area SHALL be responsive, adapting height for mobile (`h-[300px] md:h-[450px]`).

## Gherkin Scenarios

```gherkin
Feature: Loads Interactive Tracking Map

  Scenario: Toggle between List and Map view
    Given the user is on the loads page
    When they click the "Mapa" tab
    Then a Mapbox map is rendered with interactive markers
    When they click the "Lista" tab
    Then the table view is restored

  Scenario: Render markers for active loads
    Given there are loads with status "booked" or "picked_up"
    And those loads have checkpoints recorded
    When the Map tab is active
    Then markers appear on the map at each load's last checkpoint location

  Scenario: Marker shows load details on click
    Given the map is rendered with markers
    When the user clicks on a marker
    Then a popup displays the load_number, status, driver_name, last notes
    And a button "Reportar Posición" is visible

  Scenario: Marker color reflects checkpoint recency
    Given a load with a checkpoint reported less than 2 hours ago
    When the map renders
    Then that marker is green
    Given a load with a checkpoint reported more than 12 hours ago
    Then that marker is red

  Scenario: Live marker update via Realtime
    Given the map is displayed
    When a new checkpoint is broadcast on load-tracking:<load_id>
    Then the corresponding marker updates position and color without page refresh
```
