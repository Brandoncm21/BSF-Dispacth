# BFS Dispatch — Frontend Components

> Inventario de layouts, páginas, componentes de feature y reutilizables.

---

## 1. Stack de UI

| Tecnología | Versión / Notas |
|-----------|-----------------|
| Next.js | 16.2.6 App Router |
| React | 19.2.4 |
| Tailwind CSS | v4 + `tw-animate-css` |
| Shadcn/UI | Estilo `new-york`, tema `neutral`, CSS variables, iconos `lucide` |
| Radix UI | Base de primitives (button, card, dialog, table, badge, alert, label, input, tabs) |
| Recharts | Gráficos de dashboard y reportes |
| Mapbox GL JS + react-map-gl | Mapas interactivos |
| react-hook-form + @hookform/resolvers + zod | Formularios (instalado, uso parcial) |
| Lucide React | Iconos |

---

## 2. Layouts

| Layout | Archivo | Propósito |
|--------|---------|-----------|
| **Root** | `app/layout.tsx` | Fuentes tipográficas (Geist), metadatos, `<html>` y `<body>` minimal. **No** renderiza Sidebar ni Header. |
| **Auth** | `app/(auth)/login/page.tsx` | Página de login. Hereda root layout. Sin sidebar/header. |
| **Dashboard** | `app/(dashboard)/layout.tsx` | Shell principal: `<Sidebar>` + `<Header>` + `<main>`. Todas las páginas operativas usan este layout. |
| **Public** | `app/(public)/layout.tsx` | Layout mínimo para páginas públicas (tracking por token). Sin sidebar/header. |

---

## 3. Páginas (Route Groups)

| Ruta URL | Archivo | Descripción |
|----------|---------|-------------|
| `/` | `app/page.tsx` | Redirección incondicional a `/login` |
| `/login` | `app/(auth)/login/page.tsx` | Formulario de login con email/password. Muestra errores de acceso denegado o sin rol. |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Panel principal con KPIs del mes (cargas, gross revenue, net profit, carriers activos). Gráficos de tendencia, ranking de dispatchers, distribución de estados, rendimiento por carrier. Filtra por rol (dispatchers solo ven sus cargas). |
| `/dashboard/executive` | `app/(dashboard)/dashboard/executive/page.tsx` | Analítica ejecutiva: 13 presets de período, comparativa vs período anterior, KPIs con sparklines, Revenue vs Profit, selector de tiempo, impresión/PDF. Restringido a admin, back_office, sales. |
| `/dashboard/trucks` | `app/(dashboard)/dashboard/trucks/page.tsx` | Gestión de flota. Tabla y vista de tarjetas. Buscar, agregar, editar, ver historial de cargas, gestionar mantenimiento. |
| `/dashboard/human-resources` | `app/(dashboard)/dashboard/human-resources/page.tsx` | Gestión de empleados. Solo admin. Listar, cambiar rol, activar/desactivar. |
| `/loads` | `app/(dashboard)/loads/page.tsx` | Módulo central de cargas. CRUD completo, búsqueda, filtro por estado, paginación, adjuntar documentos. |
| `/carriers` | `app/(dashboard)/carriers/page.tsx` | Registro de carriers. CRUD, búsqueda, fila expandible con detalles legales (DOT, EIN, SSN, dirección, factoring, dispatch fee %). |
| `/drivers` | `app/(dashboard)/drivers/page.tsx` | Registro de drivers. CRUD, búsqueda, asignación a carrier, indicador TWIC. Panel lateral con últimos 5 viajes. |
| `/brokers` | `app/(dashboard)/brokers/page.tsx` | Registro de brokers. Lista con búsqueda. Detalle con pestañas: información general y contactos. |
| `/reports` | `app/(dashboard)/reports/page.tsx` | Reportes financieros agrupados por dispatcher, carrier y camión. Filtro de fecha, totales consolidados, exportación. |
| `/traceability` | `app/(dashboard)/traceability/page.tsx` | Monitoreo de flota. Resumen de disponibles/en ruta/mantenimiento. Mapa con checkpoints. Lista por carrier. Alertas. Timeline por camión seleccionado. |
| `/track/[token]` | `app/(public)/track/[token]/page.tsx` | Tracking público. Barra de progreso, ruta origen/destino, mapa con checkpoints, timeline. No requiere login. |

---

## 4. Componentes de Layout

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **Sidebar** | `components/sidebar.tsx` | Navegación lateral de 64px. Logo BestFreight. Módulos filtrados por rol vía `useUserRole`. Íconos de Lucide. Botón de cerrar sesión. Oculto en `/` y `/login`. Estado de carga con skeleton. |
| **Header** | `components/header.tsx` | Header sticky superior con logo, enlace a Dashboard, campana de notificaciones (`NotificationBell`). Oculto en `/` y `/login`. |

---

## 5. Componentes de Feature (Dominio del Negocio)

### Logística y Flota

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **TrackingMap** | `components/tracking-map.tsx` | Mapa interactivo Mapbox. Marcadores de camiones (color según antigüedad del reporte), checkpoints con línea de ruta, marcadores origen/destino, popups, modo no interactivo. |
| **TruckTimeline** | `components/truck-timeline.tsx` | Línea de tiempo de un camión. Historial de cargas últimos 30 días, cambios de estado, filtro por load number. |
| **TruckBadge** | `components/truck-badge.tsx` | Badge de disponibilidad: `disponible` (verde), `en_ruta` (ámbar), `maintenance` (rojo). |
| **TruckStatusBadge** | `components/truck-status-badge.tsx` | Badge de estado operacional: `active`, `inactive`, `maintenance`, `in_route`. |
| **FleetAlerts** | `components/fleet-alerts.tsx` | Panel de alertas: mantenimiento (rojo), delays >48h (ámbar), disponibles (verde). |
| **TruckSelector** | `components/truck-selector.tsx` | Dropdown custom para seleccionar camiones. Filtra por carrier, agrupa por disponibles/mantenimiento, muestra ruta actual, bloquea camiones en mantenimiento. |
| **RouteSelector** | `components/route-selector.tsx` | Dropdown custom para rutas con distancia en millas. Botón "Nueva Ruta" que abre modal. |

### Notificaciones

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **NotificationBell** | `components/notification-bell.tsx` | Campana con contador de no leídas, lista desplegable, marcar como leída individual o todas. Usa Supabase Realtime. |
| **NotificationProvider** | `components/notification-provider.tsx` | Contexto React que escucha eventos broadcast de Supabase para notificaciones en tiempo real. Expone `useNotificationEvent`. |

---

## 6. Formularios

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **LoadForm** | `components/load-form.tsx` | Formulario extenso de carga. Carrier, driver, truck (`TruckSelector`), route (`RouteSelector`), fechas, tipo de carga, requisitos especiales, rate, dispatch fee % (auto-calculado según carrier), peso, factoring, status, checkbox confirmación digital, subida de PDFs (RC y BOL, máx 5MB). Validación Zod. Expone `ref` con `submit()`. |
| **LoadFormDialog** | `components/load-form-dialog.tsx` | Dialog wrapper para `LoadForm`. Modo edición (precarga) o creación. Footer con Cancelar/Guardar. |
| **BrokerFormSheet** | `components/broker-form-sheet.tsx` | Sheet lateral para broker. First/last name, email, phone, MC number, USDOT, estado. |
| **TruckFormSheet** | `components/truck-form-sheet.tsx` | Sheet lateral para camión. Unit number, name, placa, VIN, carrier, truck type (select: Semi, Hotshot, Box Truck, Furgón, Camión, Refrigerado), chofer asignado, capacidad, peso vacío, estado operacional. Bloquea cambio de estado si `in_route`. |
| **CheckpointForm** | `components/checkpoint-form.tsx` | Reportar posición GPS. Detecta geolocalización del navegador o permite ingreso manual lat/lng. Estado (En tránsito, Recogido, Entregado) y notas. |
| **NewRouteModal** | `components/new-route-modal.tsx` | Modal de 3 pasos: Origen → Destino → Confirmar. Seleccionar/crear estado, ciudad, calle. Calcula millas. |
| **AddressModal** | `components/address-modal.tsx` | Registrar nueva dirección (estado, ciudad, calle). Usa `getOrCreateAddress`. |
| **MaintenanceDrawer** | `components/maintenance-drawer.tsx` | Sheet de mantenimiento de camión. Historial de registros. Agregar: tipo (Cambio de Aceite, Rotación de Llantas, Frenos, Inspección FMCSA), fecha, millaje, costo, descripción, notas del mecánico. Recordatorio FMCSA. |

### Selectores reutilizables

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **CreatableSelect** | `components/creatable-select.tsx` | Dropdown que permite seleccionar opción existente **o crear una nueva** inline (tipos de carga, requisitos especiales). |

---

## 7. Tablas

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **LoadsTable** | `components/loads-table.tsx` | Tabla principal de cargas. 13 columnas: Load#, Carrier, Driver, Truck, Cargo, Miles, Rate, Fee %, $/Mile, Status (selector inline para cambiar estado), Pickup, Delivery, Acciones (Ver docs, Editar, Eliminar). Badges de color por estado. |
| **ReportDataTable** | `components/reports/report-data-table.tsx` | Tabla de reportes agrupados: Entidad, Cargas, Gross Revenue, Net Profit, Margen (badge de color según rentabilidad). |

---

## 8. Dashboard y Analítica

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **PeriodSelector** | `components/dashboard/period-selector.tsx` | Selector de período agrupado: Fechas Rápidas, Trimestres, Semestres, Anual. 13 opciones predefinidas. |
| **KPICard** | `components/dashboard/kpi-card.tsx` | Tarjeta KPI con título, valor grande, cambio porcentual, sparkline (Recharts AreaChart 60px). Soporta icono y color custom. |
| **ExecutiveComparisonChart** | `components/dashboard/executive-comparison-chart.tsx` | Gráfico de barras Revenue vs Profit por período. |
| **LoadStatusDonut** | `components/dashboard/load-status-donut.tsx` | Gráfico de dona con distribución de estados de cargas. |
| **RevenueTrendChart** | `components/dashboard/revenue-trend-chart.tsx` | Gráfico de área con tendencia de Revenue y Profit. |
| **CarrierPerformanceChart** | `components/dashboard/carrier-performance-chart.tsx` | Barras horizontales con performance de carriers por revenue. |
| **DispatcherRankingChart** | `components/dashboard/dispatcher-ranking-chart.tsx` | Top 10 dispatchers por net profit, barras horizontales con degradado. |
| **SalesAnalyticsDashboard** | `components/sales-analytics.tsx` | Dashboard completo de ventas: KPIs (Revenue Total, Ganancia Total, Cargas, Margen Promedio), barras por mes, pie chart por broker, top estados más rentables. |

---

## 9. Componentes Reutilizables / Utilidades

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **TableSkeleton** | `components/table-skeleton.tsx` | Skeleton animado para tablas. Props: `rows` (default 16), `columns` (default 10). |
| **PaginationControls** | `components/pagination-controls.tsx` | Controles de paginación: "Mostrando X-Y de Z", Anterior/Siguiente con estado disabled. |
| **ErrorBoundary** | `components/error-boundary.tsx` | React Error Boundary. Captura errores y muestra `Alert` destructivo como fallback. |
| **LoadDocsDialog** | `components/load-docs-dialog.tsx` | Ver documentos adjuntos de una carga (RC, BOL). URLs firmadas de Supabase Storage, ver en nueva pestaña, eliminar. |
| **ExportButtons** | `components/reports/export-buttons.tsx` | Exportar reportes a CSV o imprimir/PDF (genera HTML de impresión estilizado). |

---

## 10. Shadcn UI Primitives (Installed)

| Componente | Archivo | Notas |
|------------|---------|-------|
| Button | `components/ui/button.tsx` | Variantes: default, destructive, outline, secondary, ghost, link. Tallas: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg |
| Card | `components/ui/card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter |
| Dialog | `components/ui/dialog.tsx` | Dialog completo con Overlay, Content, Header, Footer, Title, Description, Close, Portal, Trigger |
| Sheet | `components/ui/sheet.tsx` | **Implementación custom** (no Radix). Panel lateral derecho con backdrop |
| Table | `components/ui/table.tsx` | Componentes de tabla estilo Shadcn |
| Badge | `components/ui/badge.tsx` | Badge de estado |
| Alert | `components/ui/alert.tsx` | Alertas destructivas |
| Label | `components/ui/label.tsx` | Etiquetas de formulario |
| Input | `components/ui/input.tsx` | Input base |
| Tabs | `components/ui/tabs.tsx` | Tabs |

---

## 11. Observaciones Clave

1. **Sheet es custom**: `components/ui/sheet.tsx` no usa `@radix-ui/react-dialog`, es implementación propia.
2. **Formularios mayormente manuales**: Aunque `react-hook-form` está instalado, la mayoría de formularios usan `useState` manual. Solo `LoadForm` usa Zod para validación.
3. **Dark mode nativo**: Todos los componentes tienen clases `dark:` para modo oscuro.
4. **Patrón Sheet para CRUDs**: Broker, Truck, Maintenance usan `Sheet` como panel lateral.
5. **Patrón Dialog para acciones rápidas**: LoadForm, NewRoute, Address, LoadDocs usan `Dialog`.
6. **Mapbox requiere token**: `TrackingMap` verifica `NEXT_PUBLIC_MAPBOX_TOKEN` y muestra mensaje de configuración si falta.
