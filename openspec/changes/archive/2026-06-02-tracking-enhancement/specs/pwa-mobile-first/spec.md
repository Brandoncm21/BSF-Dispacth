# Spec: PWA Mobile-First

## Requirement Headers

- `SHALL-PWA-01`: The app MUST serve a `manifest.json` with name "BestFreight", short_name "BFS", theme_color "#18181b", and icons at 192x192 and 512x512.
- `SHALL-PWA-02`: The root `layout.tsx` MUST include `<meta name="theme-color" content="#18181b">` and `<link rel="manifest" href="/manifest.json">`.
- `SHALL-PWA-03`: A `public/manifest.json` file MUST be created with ICO-compliant PWA fields.
- `SHALL-PWA-04`: Placeholder icon SVGs or PNGs MUST be generated at 192x192 and 512x512 in `public/`.
- `SHALL-PWA-05`: The `CheckpointForm` MUST stack lat/lng inputs vertically on screens < 640px, with the GPS detect button full-width.
- `SHALL-PWA-06`: The customer portal `/track/[token]` MUST use `max-w-full` padding `px-2` on mobile and `max-w-2xl` `px-4` on desktop.
- `SHALL-PWA-07`: The `NotificationBell` dropdown MUST cap at `max-w-[90vw]` on mobile to avoid overflow.
- `SHALL-PWA-08`: The tracking map in `/track/[token]` MUST render at `h-[250px]` on mobile and `h-[350px]` on desktop.

## Gherkin Scenarios

```gherkin
Feature: PWA Mobile-First

  Scenario: PWA manifest is served
    Given the app is loaded in a browser
    When the browser requests /manifest.json
    Then it receives a valid PWA manifest with name "BestFreight" and icons

  Scenario: App can be installed on mobile
    Given a mobile browser supports PWA
    When the user views the app
    Then the "Add to Home Screen" prompt is available
    And the app opens with theme-color "#18181b"

  Scenario: CheckpointForm is mobile-friendly
    Given a driver is on a mobile device
    When they open the checkpoint form
    Then the lat and lng inputs are stacked vertically
    And the GPS "Detectar" button spans full width

  Scenario: Customer portal adapts to mobile
    Given a customer opens /track/<token> on a phone
    Then the page uses full viewport width
    And the map is h-[250px] with responsive sizing
    And text and padding are comfortable for touch interaction
```
