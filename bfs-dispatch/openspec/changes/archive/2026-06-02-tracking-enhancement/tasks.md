# Tasks: Tracking Enhancement

## 1. DB + Types (2 tasks)

- [ ] 1.1 Extend `search_trucks` RPC to return `fuel_type` and `fuel_cost_per_mile` fields
- [ ] 1.2 Add `fuel_type?: string | null` and `fuel_cost_per_mile?: number | null` to `TruckWithSmartStatus` type

## 2. Truck Fuel UI (3 tasks)

- [ ] 2.1 Add `fuel_type` (select: Diesel/Gasolina) and `fuel_cost_per_mile` (number input) fields to `truck-form-sheet.tsx`
- [ ] 2.2 Extend `createTruck` and `updateTruck` server actions to accept and persist fuel fields
- [ ] 2.3 Display fuel_type and fuel_cost_per_mile columns in trucks table and truck cards

## 3. Loads Tab Bar (2 tasks)

- [ ] 3.1 Create `components/tab-bar.tsx` with "Lista" / "Mapa" toggle buttons
- [ ] 3.2 Integrate tab bar into `app/(dashboard)/loads/page.tsx` with `useState<"lista"|"mapa">` and conditional render

## 4. Interactive Map — TrackingMapPins (4 tasks)

- [ ] 4.1 Create `components/tracking-map-pins.tsx` — Mapbox map component that fetches checkpoints for active loads (`booked`, `picked_up`)
- [ ] 4.2 Implement markers with color coding (green/amber/red by recency) and interactive popups with load details
- [ ] 4.3 Add "Reportar Posición" button inside the marker popup
- [ ] 4.4 Integrate Realtime subscription for live marker updates on load-tracking channels

## 5. PWA Configuration (3 tasks)

- [ ] 5.1 Create `public/manifest.json` with name "BestFreight", theme_color "#18181b", icons 192x192 and 512x512
- [ ] 5.2 Create placeholder icon SVGs at `public/icon-192x192.svg` and `public/icon-512x512.svg`
- [ ] 5.3 Add PWA meta tags (theme-color, manifest link, apple-mobile-web-app) to root `app/layout.tsx`

## 6. Responsive Mobile (3 tasks)

- [ ] 6.1 Make `CheckpointForm` responsive: stack lat/lng vertically on mobile, full-width GPS button
- [ ] 6.2 Make customer portal `/track/[token]` responsive: full-width map on mobile, reduced padding
- [ ] 6.3 Make `NotificationBell` dropdown responsive: max-w-[90vw] on mobile, prevent overflow

## 7. Validation & Archive (1 task)

- [ ] 7.1 Run build (`npm run build`), commit, and archive change via `openspec archive tracking-enhancement`

## Totals
- 7 grupos, 18 tareas
