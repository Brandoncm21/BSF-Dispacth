# BFS Dispatch — API Surface

> Inventario de Server Actions, hooks, schemas y patrones de cliente Supabase.

---

## 1. Patrones de Cliente Supabase

Tres factories + un legacy. Nunca crear clientes inline.

| Factory | Archivo | Uso |
|---------|---------|-----|
| `createSupabaseServerClient()` | `lib/supabase-server.ts` | Server Components (RSC). Lee cookies vía `next/headers`. El `setAll` se envuelve en `try/catch` porque en RSC el set se ignora. |
| `createSupabaseBrowserClient()` | `lib/supabase-browser.ts` | Client Components (browser). Usa `createBrowserClient` de `@supabase/ssr`. |
| `getSupabaseServerClient()` | `lib/actions/core.ts` | Server Actions. Incluye verificación de autenticación: lanza error si no hay usuario. |
| `createClient()` (legacy) | `lib/supabase.ts` | Singleton legacy. **No usar en código nuevo.** Solo para compatibilidad. |

**Regla**: Server actions siempre importan `getSupabaseServerClient` de `core.ts`. Hooks del browser usan `createSupabaseBrowserClient` o el singleton legacy.

---

## 2. Server Actions por Dominio

### 2.1 Auth (`lib/auth-actions.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `login` | `(formData: FormData) => Promise<void>` | Login con email/password vía Supabase Auth. Redirige a `/dashboard`. |
| `logout` | `() => Promise<void>` | SignOut. Redirige a `/login`. |
| `getUserRole` | `() => Promise<string \| null>` | Consulta RPC `get_user_role_type`. |

---

### 2.2 Loads (`lib/actions/loads.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `createLoad` | `(formData: FormData) => Promise<{ load_id: number; load_number: string }>` | Crea carga con validación Zod. Inserta en `loads` + `load_status_history`. |
| `updateLoad` | `(loadId: number, formData: FormData) => Promise<void>` | Actualiza carga. Registra cambio de estado en historial si aplica. |
| `deleteLoad` | `(loadId: number) => Promise<void>` | Soft delete: `status_id = 2`. |
| `updateLoadStatus` | `(loadId: number, status: LoadStatus) => Promise<void>` | Cambia estado de carga y registra en `load_status_history`. |
| `searchLoads` | `(search: string, statusFilter: string, page: number, pageSize: number) => Promise<{ data: Load[], total: number }>` | Búsqueda paginada vía RPC `search_loads`. |

**Schemas Zod:**
- `createLoadSchema`: `carrier_id`, `truck_id`, `driver_id`, `route_id` (>=1), `cargo_type_id` (nullable), `special_requirements_id` (nullable), `rate` (optional), `dispatch_fee_pct` (0-100), `weight_lbs` (optional), `load_data` (optional), `factoring` (default false), `load_status` (default "pending"), `paid_status` (default "unpaid"), `picked_up_at` (requerido), `delivered_at` (requerido).
- `updateLoadSchema`: mismos campos, todos opcionales.

---

### 2.3 Catalog (`lib/actions/catalog.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `searchCarriers` | `(search: string, statusFilter: number, page: number, pageSize: number) => Promise<PaginatedResult>` | |
| `createCarrier` | `(data: CarrierFormData) => Promise<void>` | |
| `updateCarrier` | `(carrierId: number, data: CarrierFormData) => Promise<void>` | |
| `softDeleteCarrier` | `(carrierId: number) => Promise<void>` | `status_id = 2` |
| `searchDrivers` | `(search: string, statusFilter: number, page: number, pageSize: number) => Promise<PaginatedResult>` | |
| `createDriver` | `(data: DriverFormData) => Promise<void>` | |
| `updateDriver` | `(driverId: number, data: DriverFormData) => Promise<void>` | |
| `softDeleteDriver` | `(driverId: number) => Promise<void>` | |
| `getStates` | `() => Promise<State[]>` | |
| `getCities` | `(stateId: number) => Promise<City[]>` | |
| `searchAddresses` | `(query: string, cityId?: number) => Promise<Address[]>` | |
| `getActiveCarriers` | `() => Promise<Carrier[]>` | |
| `getActiveDrivers` | `() => Promise<Driver[]>` | |
| `getActiveTrucks` | `() => Promise<Truck[]>` | |
| `getActiveBrokers` | `() => Promise<Broker[]>` | |
| `getRoles` | `() => Promise<Role[]>` | |
| `getActiveCargoTypes` | `() => Promise<CargoType[]>` | |
| `getActiveSpecialRequirements` | `() => Promise<SpecialRequirement[]>` | |
| `createCargoType` | `(name: string) => Promise<void>` | Upsert con deduplicación |
| `createSpecialRequirement` | `(description: string) => Promise<void>` | Upsert con deduplicación |
| `getDriversByCarrier` | `(carrierId: number) => Promise<Driver[]>` | vía RPC |
| `getCarrierDispatchFee` | `(carrierId: number) => Promise<number>` | vía RPC |

---

### 2.4 Routes (`lib/actions/routes.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `getRoutesWithDetails` | `() => Promise<Route[]>` | Lista rutas con origen/destino anidados |
| `getOrCreateAddress` | `(street: string, cityId: number, stateId: number) => Promise<number>` | Upsert de calles y direcciones |
| `getOrCreateCity` | `(cityName: string, stateId: number) => Promise<number>` | vía RPC `get_or_create_city` |
| `getOrCreateStreet` | `(streetName: string, cityId: number, stateId: number) => Promise<number>` | vía RPC `get_or_create_street` |
| `getOrCreateRoute` | `(originAddressId: number, destinationAddressId: number, miles?: number) => Promise<number>` | Upsert de rutas |
| `createRoute` | `(originData, destinationData, miles) => Promise<number>` | Wrapper de RPC `create_route_full` |

---

### 2.5 Documents (`lib/actions/documents.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `uploadLoadDocument` | `(loadId: number, documentType: "BOL" \| "RC" \| "POD", file: File, uploadedBy: string) => Promise<void>` | Sube PDF a Storage bucket `load_documents` + metadatos en BD |
| `getLoadDocuments` | `(loadId: number) => Promise<LoadDocument[]>` | |
| `getDocumentSignedUrl` | `(filePath: string) => Promise<string>` | URL firmada 1 hora |
| `deleteLoadDocument` | `(documentId: number, filePath: string) => Promise<void>` | Elimina de storage y BD |

**Schema**: `documentSchema` — valida tipo y tamaño máximo 5MB.

---

### 2.6 Fleet (`lib/actions/fleet.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `searchTrucks` | `(search: string, page: number, pageSize: number) => Promise<PaginatedResult>` | |
| `getTruckById` | `(truckId: number) => Promise<Truck>` | |
| `getTrucksWithAvailability` | `() => Promise<Truck[]>` | |
| `getTrucksWithSmartStatus` | `() => Promise<Truck[]>` | |
| `getTrucksByCarrier` | `(carrierId: number) => Promise<Truck[]>` | |
| `getTruckLoadHistory` | `(truckId: number, days: number) => Promise<Load[]>` | vía RPC |
| `getTruckStatusHistory` | `(truckId: number, days: number) => Promise<StatusHistory[]>` | vía RPC |
| `getFleetOverview` | `() => Promise<FleetOverview>` | Agrupa camiones activos por carrier |
| `getFleetAlerts` | `() => Promise<FleetAlert[]>` | Alertas de mantenimiento, delays >48h, disponibles |
| `createTruck` | `(data: TruckFormData) => Promise<void>` | |
| `updateTruck` | `(truckId: number, data: TruckFormData) => Promise<void>` | |
| `updateTruckStatus` | `(truckId: number, operationalStatus: string) => Promise<void>` | |
| `getMaintenanceRecords` | `(truckId: number) => Promise<MaintenanceRecord[]>` | |
| `createMaintenanceRecord` | `(data: MaintenanceFormData) => Promise<void>` | |
| `updateMaintenanceRecord` | `(id: number, data: MaintenanceFormData) => Promise<void>` | |
| `deleteMaintenanceRecord` | `(id: number) => Promise<void>` | |

---

### 2.7 Brokers (`lib/actions/fleet.ts` — comparte archivo)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `getBrokerById` | `(brokerId: number) => Promise<Broker>` | |
| `getBrokers` | `() => Promise<Broker[]>` | |
| `searchBrokers` | `(search: string, statusFilter: number, page: number, pageSize: number) => Promise<PaginatedResult>` | |
| `createBroker` | `(data: BrokerFormData) => Promise<void>` | |
| `updateBroker` | `(brokerId: number, data: BrokerFormData) => Promise<void>` | |
| `getBrokerContacts` | `(brokerId: number) => Promise<BrokerContact[]>` | vía RPC |
| `createBrokerContact` | `(contact: BrokerContactForm) => Promise<void>` | |
| `updateBrokerContact` | `(contactId: number, contact: BrokerContactForm) => Promise<void>` | |
| `deleteBrokerContact` | `(contactId: number) => Promise<void>` | |
| `setPrimaryContact` | `(contactId: number, brokerId: number) => Promise<void>` | |

---

### 2.8 Sales / Analytics (`lib/actions/sales.ts`, `analytics.ts`, `executive-analytics.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `getSalesAnalytics` | `(fromDate?: string, toDate?: string) => Promise<SalesAnalytics>` | Agrega desde `v_sales_performance` |
| `getDashboardAnalytics` | `(dispatcherId?: number, tzOffsetMinutes?: number) => Promise<DashboardAnalytics>` | KPIs, tendencia, ranking, distribución de estados, rendimiento carriers. Usa `v_sales_performance_extended`. |
| `getExecutiveAnalytics` | `(preset: PeriodPreset, tzOffsetMinutes?: number) => Promise<ExecutiveAnalytics>` | 13 presets de período, comparativa vs período previo, sparklines. |

---

### 2.9 Reports (`lib/actions/reports.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `getReportsData` | `(range: DateRange, tzOffsetMinutes?: number) => Promise<ReportsData>` | Agrega por dispatcher, carrier y truck desde `v_sales_performance_extended`. |

---

### 2.10 Tracking (`lib/actions/tracking.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `reportCheckpoint` | `(formData: FormData) => Promise<void>` | Valida Zod, inserta `driver_checkpoints`, auto-transiciona estado de carga a `picked_up`/`delivered`, broadcast Realtime. |
| `getCheckpointHistory` | `(loadId: number) => Promise<Checkpoint[]>` | |
| `getLoadTrack` | `(token: string) => Promise<LoadTrack>` | Tracking público por token UUID. Incluye checkpoints y ruta. |

**Schema Zod**: `reportCheckpointSchema` — `load_id` (>=1), `driver_id` (>=1), `lat` (-90 a 90), `lng` (-180 a 180), `status_at_checkpoint` (optional), `notes` (optional).

---

### 2.11 Notifications (`lib/actions/notifications.ts`)

| Action | Firma | Descripción |
|--------|-------|-------------|
| `createNotification` | `(params: NotificationParams) => Promise<void>` | Inserta notificación + broadcast Realtime |
| `getNotifications` | `(recipientType: string, recipientId: number, limit?: number) => Promise<Notification[]>` | |
| `getUnreadCount` | `(recipientType: string, recipientId: number) => Promise<number>` | |
| `markRead` | `(notificationId: number) => Promise<void>` | |
| `markAllRead` | `(recipientType: string, recipientId: number) => Promise<void>` | |

---

## 3. Hooks Custom

| Hook | Archivo | Propósito |
|------|---------|-----------|
| `useLoads` | `hooks/use-loads.ts` | Estado de cargas: `loads`, `loading`, `error`, `search`, `statusFilter`, `page`, `totalItems`. Carga selects referenciales (carriers, trucks, drivers) vía browser client. Expone `fetchLoads`, `updateStatus`, `handleDelete`, `handleCreateCargoType`, `handleCreateSpecialRequirement`. |
| `useHasAccess` | `hooks/use-has-access.ts` | `(module: string) => { hasAccess: boolean, loading }`. Obtiene rol vía RPC `get_user_role_type` y evalúa contra `ROLE_PERMISSIONS`. Se suscribe a `onAuthStateChange`. |
| `useUserRole` | `hooks/use-has-access.ts` | `() => { role: RoleType \| null, loading }`. Solo retorna el rol. |
| `useApiError` | `hooks/use-api-error.ts` | `{ error, setError, handleError, clearError }`. `handleError` normaliza cualquier error a `AppError` vía `parseSupabaseError`. |

---

## 4. Error Handling

| Utilidad | Archivo | Descripción |
|----------|---------|-------------|
| `AppError` | `lib/errors.ts` | Clase que extiende `Error` con `code?` y `field?`. |
| `parseSupabaseError` | `lib/errors.ts` | Normaliza errores de Supabase, objetos genéricos o instancias de `Error` a `AppError`. |

Todas las server actions lanzan errores. Los client components capturan con `try/catch` y usan `useApiError` para mostrar mensajes.

---

## 5. Formato de Fechas y Moneda

| Utilidad | Archivo | Descripción |
|----------|---------|-------------|
| `formatTimestamp` | `lib/format.ts` | ISO a `MM/DD HH:mm` (timezone Costa Rica). |
| `formatUSD` | `lib/format.ts` | Moneda USD con separadores de miles. |
| `formatDollarPerMile` | `lib/format.ts` | Revenue por milla. |
| `toDatetimeLocal` | `lib/format.ts` | ISO a `datetime-local` para inputs HTML. |

---

## 6. Constantes de Dominio

| Constante | Archivo | Valores |
|-----------|---------|---------|
| `LOAD_STATUS` / `LoadStatus` | `lib/constants.ts` | `pending`, `booked`, `picked_up`, `delivered`, `paid` |
| `LOAD_STATUS_LABELS` | `lib/constants.ts` | Etiquetas en español |
| `LOAD_STATUS_COLORS` | `lib/constants.ts` | Clases Tailwind para badges |
| `PAID_STATUS` / `PaidStatus` | `lib/constants.ts` | `unpaid`, `partial`, `paid` |
| `LOAD_STATUS_TRANSITIONS` | `lib/constants.ts` | Orden lógico de transición de estados |
