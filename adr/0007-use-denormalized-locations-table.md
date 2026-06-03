# ADR-0007: Use Denormalized locations Table over Normalized addresses/streets/cities

**Status**: accepted

**Date**: 2026-06-02

## Context

El esquema de direcciones heredado de Oracle usaba 4 tablas normalizadas (states, cities, streets, addresses) para representar geografía. Esto requería joins de 5 niveles para obtener una dirección completa, un wizard de 3 pasos para el usuario, y funciones RPC get-or-create complejas. Mapbox Places API ya normaliza y valida direcciones mejor que cualquier catálogo manual.

## Decision

Reemplazar las tablas `addresses`, `streets`, y `cities` por una tabla `locations` denormalizada que guarda `formatted_address`, `street`, `city`, `state`, `zip`, `lat`, `lng` y `mapbox_place_id`. Las direcciones se obtienen directamente de Mapbox y se guardan una sola vez por `place_id`.

La tabla `states` se mantiene como catálogo maestro porque es usada por otros módulos (empleados, carriers) no relacionados a rutas.

## Consequences

- ✅ UX de creación de ruta pasa de 6+ clicks y 3 requests a 2 inputs con autocomplete y cálculo automático
- ✅ Consultas de rutas pasan de 5 joins a 2 joins
- ✅ Lat/lng precisos disponibles para mapas, cálculos y geofencing futuro
- ✅ Mapbox normaliza direcciones por nosotros (no más "Houstn" vs "Houston")
- ⚠️ Ciudades y estados no son catálogo maestro propio. Depende de Mapbox.
- ⚠️ Posible duplicación de formatos si Mapbox cambia `place_name` para una misma ubicación (mitigado por `mapbox_place_id` UNIQUE)
- ⚠️ Migración batch requiere geocodificación masiva con rate limiting
