# Design: Tracking Enhancement

## C4 Context Diagram

```
[Dispatcher/BestFreight]
    |
    | (web browser mobile/desktop)
    v
[BestFreight Web App (Next.js 16)]
    |
    |--- /dashboard/trucks → Truck Fuel UI
    |--- /loads → Tabs (Lista | Mapa) + TrackingMapPins
    |--- /track/[token] → Mobile customer portal
    |
    v
[Supabase (PostgreSQL + Realtime)]
    |
    |--- trucks (fuel_type, fuel_cost_per_mile)
    |--- driver_checkpoints (realtime published)
    |--- notifications (realtime published)
    |
    v
[Mapbox (GL JS + Directions API)]
    |
    |--- Geocoding API (ciudad→coords)
    |--- Directions API (ruta→millas)
    |--- GL JS (map rendering + markers)
```

## Container Diagram

```
app/(dashboard)/loads/page.tsx
    ├── TabBar ("Lista" | "Mapa") [state: activeTab]
    ├── [activeTab === "lista"]
    │   └── LoadsTable + PaginationControls
    └── [activeTab === "mapa"]
        └── TrackingMapPins (dynamic, ssr:false)
            ├── Mapbox Map
            ├── Interactive Markers (colored by recency)
            └── Popups (load details + action buttons)

app/(dashboard)/dashboard/trucks/page.tsx
    └── TruckFormSheet
        └── Fuel fields (fuel_type select + fuel_cost_per_mile input)

app/(public)/track/[token]/page.tsx
    └── TrackingPageClient
        └── TrackingMap (responsive height)

components/notification-bell.tsx
    └── Dropdown (max-w-[90vw] on mobile)

components/checkpoint-form.tsx
    └── Responsive layout (stack vertical on mobile)
```

## Decisiones Técnicas

### 1. Tabs via useState (no URL params)
No se requiere estado en la URL porque el mapa no necesita deep-linking. El estado local `activeTab` es suficiente y evita re-renders completos al cambiar de tab.

### 2. TrackingMapPins component
Extiende `TrackingMap` actual con:
- Filtro automático: solo loads con status `booked` o `picked_up`
- Fetch de checkpoints via `getCheckpointHistory` para múltiples loads
- Popup con detalles extendidos (notas, conductor, botón acción)
- Suscripción Realtime a múltiples canales `load-tracking:<id>`

### 3. PWA via manifest.json estático
No se usa `next-pwa` debido a problemas de compatibilidad con Turbopack (Next.js 16). En su lugar:
- `public/manifest.json` estático (validado por Lighthouse)
- Service worker opcional para caché offline (se puede agregar después)
- Meta tags en `layout.tsx`

### 4. Fuel data flow
```
trucks table (fuel_type, fuel_cost_per_mile)
    → search_trucks RPC (extendido)
    → TruckWithSmartStatus (type extendido)
    → TruckFormSheet (UI form fields)
```

## Stack Tecnológico
- Mapbox GL JS v3.x (ya instalado) para markers personalizados
- Supabase Realtime para actualización en vivo de pins
- Zod v4 para validación de fuel fields
- CSS Tailwind responsive utilities
