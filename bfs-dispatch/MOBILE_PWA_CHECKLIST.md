# Checklist Mobile/PWA — BestFreight Dispatch

> Última actualización: 2026-06-02
> Propósito: Documentar el estado del soporte mobile y PWA para probar cuando tengamos acceso a dispositivos.

---

## PWA (Progressive Web App)

| # | Requisito | Estado | Dónde |
|---|-----------|--------|-------|
| 1 | `manifest.json` servido en `/manifest.json` | ✅ | `public/manifest.json` |
| 2 | `name: "BestFreight"`, `short_name: "BFS"` | ✅ | `manifest.json` |
| 3 | `theme_color: "#18181b"` (meta + manifest) | ✅ | `app/layout.tsx` + `manifest.json` |
| 4 | `display: "standalone"` (sin barra de navegación) | ✅ | `manifest.json` |
| 5 | Icono 192x192 SVG (truck icon) | ✅ | `public/icon-192x192.svg` |
| 6 | Icono 512x512 SVG | ✅ | `public/icon-512x512.svg` |
| 7 | `apple-mobile-web-app-capable` meta | ✅ | `app/layout.tsx` (appleWebApp) |
| 8 | Service worker offline | ❌ | No implementado (ver ADR-004) |

### Cómo probar la instalación PWA
1. Abrir la app en **Chrome Android** → menú → "Agregar a pantalla de inicio"
2. Abrir la app en **Safari iOS** → compartir → "Agregar a pantalla de inicio"
3. Verificar que:
   - Aparece el icono del camión
   - Al abrir, no tiene barra de navegación del navegador
   - El color de la barra de estado es `#18181b`
   - La app ocupa toda la pantalla

---

## Responsive Design

| # | Componente | Estado | Detalle |
|---|------------|--------|---------|
| 1 | **CheckpointForm** | ✅ | Lat/lng apilados verticalmente en <640px, botón "Detectar" full-width |
| 2 | **Customer Portal** (`/track/[token]`) | ✅ | `max-w-full` en mobile, `max-w-2xl` en desktop, padding: `px-2` → `px-4` |
| 3 | **NotificationBell dropdown** | ✅ | `max-w-[90vw]` para evitar overflow en pantallas pequeñas |
| 4 | **Tabla de cargas** | ✅ | Scroll horizontal nativo, `TableSkeleton` responsive |
| 5 | **Sidebar** (dashboard) | ⚠️ | No probado en mobile — puede necesitar hamburger menu |
| 6 | **Header** | ⚠️ | Iconos agrupados, verificar espaciado en <360px |

### Breakpoints usados
- `sm` (640px) — Ajustes de formularios y layout
- `md` (768px) — Tamaño de mapa, grid columns
- `lg/` (1024px+) — Layout desktop completo

---

## Mapas (Mapbox GL)

| # | Vista | Estado | Notas |
|---|-------|--------|-------|
| 1 | `/traceability` — Mapa de flota | ✅ | Siempre visible ahora; mensaje "No hay camiones en ruta" si vacío |
| 2 | `/loads` — Tab "Mapa" | ✅ | `TrackingMapPins` con markers interactivos + popups |
| 3 | `/track/[token]` — Portal cliente | ✅ | Mapa 250px mobile / 350px desktop |
| 4 | LoadForm — Fuel cost | ✅ | No requiere mapa, solo datos de truck + ruta |
| 5 | NewRouteModal — "Calcular con Mapbox" | ✅ | Geocoding + Directions API |

### Notas del mapa
- Todos los mapas usan `dynamic(() => import(...), { ssr: false })` para evitar errores SSR
- `mapbox-gl` CSS se importa en el componente
- Token configurado en `.env.local`

---

## Flujo de Tracking (sin probar end-to-end)

Paso | Acción | Pantalla | Dispositivo
-----|--------|----------|------------
1 | Crear carga | `/loads` (Nueva Carga) | Desktop
2 | Configurar ruta con Mapbox | NewRouteModal | Desktop
3 | Ver fuel cost estimado | LoadForm | Desktop
4 | Ir a `/loads` → Tab Mapa | Marcadores de cargas activas | Desktop/Mobile
5 | Click marker → popup con detalles | Popup interactivo | Desktop/Mobile
6 | Ir a `/traceability` | Mapa de flota + lista | Desktop/Mobile
7 | Driver reporta checkpoint | CheckpointForm dialog | Mobile
8 | Dispatcher ve notificación 🔔 | Header NotificationBell | Desktop/Mobile
9 | Cliente abre `/track/<token>` | Portal público con mapa + timeline | Mobile

---

## Pendiente para próxima iteración

- [ ] Service worker para caché offline parcial
- [ ] Splash screen iconos PNG reales (SVG funciona pero PNG es más compatible)
- [ ] Hamburger menu para sidebar en mobile
- [ ] Touch targets mínimos 44px en botones pequeños (<36px)
- [ ] Pull-to-refresh en páginas de lista
- [ ] Pruebas en iOS Safari (webkit-specific bugs)
- [ ] Pruebas en Android Chrome
- [ ] Pruebas de instalación PWA en ambos OS
