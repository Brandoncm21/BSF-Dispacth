# 0001. Use Mapbox as map provider for tracking

- Status: accepted
- Date: 2026-06-02

## Context

The tracking system needs a map provider to render truck positions and checkpoint history. Three options were evaluated: Mapbox, Google Maps, and Leaflet + OpenStreetMap.

Key constraints:
- Zero-cost operation at current scale (under 50k loads/month)
- Professional appearance for customer-facing tracking pages
- Good React/Next.js integration
- No billing account requirement during development

## Decision

We will use **Mapbox GL JS** (`mapbox-gl` + `react-map-gl`) as the map provider.

Mapbox's free tier covers 50,000 map loads per month — far exceeding current volume. The React integration via `react-map-gl` is mature, well-documented, and supports all required features: markers, popups, fly-to animations, and geocoding.

If Mapbox usage exceeds the free tier, we can upgrade to the paid Developer tier ($50/mo for 100k loads) or migrate to Leaflet/OpenStreetMap using the existing coordinate data without schema changes.

## Consequences

- Positive: Professional map appearance out of the box. Excellent developer experience with React bindings. Geocoding API included for address-to-coordinate conversion.
- Negative: External API dependency. If billing is required in future, must manage API keys. Mapbox pricing changes could affect operating costs.
- Neutral: Lat/lng coordinates are stored in our database — if we migrate providers later, no data migration is needed.
