# ADR-005: Mapbox Interactive Markers — Custom DOM Elements vs react-map-gl Popups

## Status
Accepted

## Context
Se requiere renderizar markers interactivos con popups que contengan notas y acciones. `react-map-gl` ofrece `<Marker>` y `<Popup>` components de React, pero requieren estado de React para manejar clicks y tienen overhead de re-renderizado.

## Decision
Usar la API nativa de Mapbox GL JS (`mapboxgl.Marker`, `mapboxgl.Popup`) con elementos DOM custom. Coincide con el enfoque ya usado en `TrackingMap`.

## Consequences
- **Pros**: Sin re-renders de React, control total sobre el DOM del marker, popup con HTML inline, rendimiento fluido con ~100+ markers.
- **Cons**: Más código imperativo, gestión manual de eventos y limpieza.
- **Patrón**: `new mapboxgl.Marker({ element: customDiv }).setLngLat([lng, lat]).setPopup(popup).addTo(map)`
