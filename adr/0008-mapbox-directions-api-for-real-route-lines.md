# ADR-0008: Mapbox Directions API for Real Road Route Lines

**Status**: Accepted  
**Date**: 2026-06-02  
**Change**: mapbox-route-integration

## Context

The tracking maps (`/traceability`, Load Detail Modal) were rendering straight Euclidean LineStrings between origin, waypoints, and destination. This produces inaccurate visuals (lines cutting across empty terrain) and incorrect distance calculations for logistics planning.

## Decision

Use **Mapbox Directions API** (`mapbox/driving` profile) with `overview=full` to obtain real road geometry for every route line rendered on tracking maps.

## Consequences

- **Positive**: Routes follow actual highways and roads. Distance calculations reflect real driving distance, making fuel cost estimates and rate/mile ratios accurate for logistics.
- **Positive**: The API returns a GeoJSON LineString that can be directly rendered using `map.addSource({ type: "geojson" })` without additional processing.
- **Positive**: Waypoint support built-in — the API accepts a semicolon-separated coordinate string and returns a single route through all stops.
- **Positive**: Reuses the existing `NEXT_PUBLIC_MAPBOX_TOKEN` — no new secrets or billing.
- **Negative**: Each route render requires an API call. With many active loads on the traceability page, this could hit Mapbox rate limits (50k requests/month on free tier). Mitigation: only call Directions API for the Load Detail Modal (single load); traceability page falls back to direct LineString.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Mapbox Directions API** (chosen) | Real roads, waypoint support, GeoJSON output | Rate limits, latency |
| **Euclidean LineString** (status quo) | Instant, no API cost | Wrong distance, wrong visuals |
| **PostGIS + pgRouting** | Self-hosted, no rate limits | Complex setup, heavy DB compute |

## Implementation

1. `calculateRouteMiles()` in `lib/actions/routes.ts` accepts `waypoints[]` and returns `{ miles, geometry, error }`
2. `TrackingMap` accepts optional `routeGeometry` prop (`{ type: "LineString"; coordinates: number[][] }`)
3. When `routeGeometry` is available, the map draws it using `map.addSource({ type: "geojson", data: feature })` — the route follows real roads
4. When `routeGeometry` is unavailable, the map falls back to direct LineString
5. Load Detail Modal calls `calculateRouteMiles()` with all coordinates and passes the geometry to `TrackingMap`
