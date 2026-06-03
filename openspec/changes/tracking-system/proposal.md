## Why

Brokers y shippers exigen visibilidad en tiempo real de sus cargas. Actualmente el status solo cambia cuando el dispatcher lo marca manualmente, sin que el chofer pueda reportar su progreso. Necesitamos que el chofer reporte checkpoints desde su celular, que el dispatcher vea posiciones en un mapa, y que el shipper pueda rastrear su carga sin llamar — diferenciador competitivo clave en freight dispatch.

## What Changes

- Nueva tabla `driver_checkpoints`: lat/lng + nota + status + timestamp
- Nueva tabla `notifications`: persistente, in-app, unread/read
- Nuevo componente `TrackingMap` en `/traceability`: Mapbox con última posición de camiones en ruta
- Nueva página `/track/[token]` pública: customer portal para shippers
- Nuevo componente `NotificationBell`: badge + dropdown de notificaciones
- Supabase Realtime: broadcast de nuevos checkpoints a dispatchers en vivo
- MCP Mapbox: configuración de token y componente base
- Nuevas server actions: `reportCheckpoint`, `getLoadTrack`, `getNotifications`, `markRead`

## Capabilities

### New Capabilities
- `driver-checkpoint`: Chofer reporta posición (lat/lng) y nota desde la web app
- `tracking-map`: Mapa en dispatcher dashboard mostrando última posición de cada camión en ruta
- `realtime-notifications`: Supabase Realtime broadcast de nuevos checkpoints a dispatchers
- `notification-center`: Bell icon con dropdown de notificaciones y badge de no leídas
- `customer-portal`: URL pública `/track/[token]` para que shippers vean el progreso de su carga

### Modified Capabilities

None — no existing behaviour specs are modified by this change.

## Impact

- **Frontend**: Nuevas páginas `/track/[token]`, componentes Mapbox, Realtime subscription
- **Backend**: Tablas SQL (`driver_checkpoints`, `notifications`), server actions, Supabase Realtime config
- **API externa**: Mapbox (requiere token de cuenta gratuita hasta 50k cargas/mes)
- **Dependencias**: `mapbox-gl`, `@mapbox/mapbox-gl-geocoder`
- **Seguridad**: Tokens públicos de tracking deben ser UUIDs no adivinables
