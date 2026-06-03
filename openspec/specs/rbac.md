# BFS Dispatch — RBAC System

> Sistema de roles, permisos, middleware y Row Level Security.

---

## 1. Roles Definidos

| Rol | Label | Módulos accesibles | Descripción |
|-----|-------|-------------------|-------------|
| `admin` | Administrador | `*` (todos) | Acceso total al sistema |
| `back_office` | Back Office | dashboard, loads, trucks, drivers, carriers, brokers, traceability, reports, sales, executive | Operaciones administrativas |
| `dispatcher` | Dispatcher | dashboard, loads, traceability | Operador de carga |
| `logistics` | Logística | dashboard, loads, trucks, drivers, carriers, traceability | Gestión logística |
| `sales` | Ventas | dashboard, brokers, reports, sales, executive | Gestión de ventas y brokers |

---

## 2. Mapa de Módulos a Rutas

| Módulo | Ruta | Restricción especial |
|--------|------|----------------------|
| `dashboard` | `/dashboard` | Ninguna |
| `loads` | `/loads` | Ninguna |
| `trucks` | `/dashboard/trucks` | Ninguna |
| `drivers` | `/drivers` | Ninguna |
| `carriers` | `/carriers` | Ninguna |
| `brokers` | `/brokers` | Ninguna |
| `traceability` | `/traceability` | Ninguna |
| `reports` | `/reports` | Ninguna |
| `sales` | `/dashboard/sales` | Ninguna |
| `executive` | `/dashboard/executive` | Ninguna |
| `human_resources` | `/dashboard/human-resources` | **Admin only** (via `roleRestrictedPaths`) |

---

## 3. Middleware (`middleware.ts`)

### Paths protegidos (requieren autenticación)
- `/dashboard`, `/loads`, `/carriers`, `/drivers`, `/reports`, `/brokers`, `/traceability`

### Paths restringidos por rol
- `/dashboard/human-resources` requiere módulo `human_resources`

### Flujo de verificación
1. Si la ruta no está en `protectedPaths` → pasa.
2. Crea `createServerClient` con cookies del request.
3. Verifica sesión con `supabase.auth.getUser()`.
4. Si no hay usuario → redirige a `/login?redirect={pathname}`.
5. Obtiene rol desde DB vía RPC `get_user_role_type()`.
6. Si no hay rol → redirige a `/login?error=No role assigned`.
7. Si la ruta tiene `restrictedModule` y el rol no tiene acceso → redirige a `/dashboard?denied=1`.
8. Si pasa todas las verificaciones → `NextResponse.next()`.

---

## 4. Client-Side Access Control

### `useHasAccess(module: string)`
- Hook que consulta la sesión activa.
- Obtiene rol vía `get_user_role_type()` RPC.
- Evalúa con `hasAccess(role, module)` desde `config/roles.ts`.
- Se suscribe a `onAuthStateChange` para actualizar en tiempo real.

### `useUserRole()`
- Versión simplificada: solo retorna el rol del usuario autenticado.

### Sidebar (`components/sidebar.tsx`)
- Renderiza nav items dinámicamente según `getAccessibleModules(userRole)`.
- Cada módulo se mapea a `MODULE_ROUTE_MAP` para obtener href.
- Oculto en `/` y `/login`.

---

## 5. Row Level Security (RLS)

### Políticas por dominio

| Dominio | Tablas | SELECT | INSERT/UPDATE/DELETE |
|---------|--------|--------|----------------------|
| Catálogos | `record_status`, `roles`, `license_types`, `cargo_types`, `special_requirements`, `states`, `cities`, `streets`, `addresses` | `authenticated` | `admin` only |
| Brokers | `brokers` | `authenticated` | `admin` |
| Carriers | `carriers` | `authenticated` | `admin` |
| Drivers | `drivers` | `authenticated` | `admin` |
| Employees | `employees` | Admin o propio registro (`auth_user_id = auth.uid()`) | `admin` only |
| Roles | `roles` | Todos | `admin` only |
| Trucks | `trucks` | `authenticated` | `authenticated` |
| Routes | `routes` | `authenticated` | `authenticated` |
| **Loads** | `loads` | `admin` O dispatcher asignado (`dispatcher_id = employee_id`) | `admin` O dispatcher asignado |
| Sales | `sales` | `admin` | `admin` |
| Sales Details | `sales_details` | `admin` | `admin` |
| Billing | `billing` | `admin` | `admin` |
| Documents | `load_documents` | `admin` o dispatcher de carga asociada | `admin` o dispatcher de carga asociada |
| Status History | `load_status_history` | `authenticated` | `admin` o cualquier `authenticated` |

### Storage RLS (Bucket `load_documents`)
| Operación | Política |
|-----------|----------|
| SELECT | `admin` o dispatcher asignado a la carga del documento |
| INSERT | `admin` o cualquier `authenticated` |
| DELETE | `admin` only |

---

## 6. Funciones RPC de Administración

| Función | Permiso | Descripción |
|---------|---------|-------------|
| `update_employee_role(p_employee_id, p_new_role_id)` | Admin only | Cambia el rol de un empleado |
| `toggle_employee_status(p_employee_id)` | Admin only | Activa o desactiva un empleado |
| `handle_new_user()` | Trigger interno | Crea registro en `employees` cuando un usuario se registra en `auth.users` |

---

## 7. Auto-provisionamiento de Usuarios

**Trigger**: `on_auth_user_created` (AFTER INSERT en `auth.users`)
- Crea automáticamente un registro en `employees`.
- Asigna rol default (configurable en la función).
- Vincula `auth_user_id` con el UUID de Supabase Auth.

**Implicación**: Todo usuario de Supabase Auth debe tener un `employees` record para poder acceder al sistema. Si falta, el middleware redirige a login con error "No role assigned".

---

## 8. Decisiones de Seguridad

### D1: Auth basado en Supabase Auth + empleados vinculados
- **Rationale**: Supabase Auth maneja JWT, cookies y refresh tokens. El negocio necesita metadatos adicionales (nombre, rol, vendor) que no caben en el JWT. La tabla `employees` extiende `auth.users`.

### D2: RLS + RPC SECURITY DEFINER para búsquedas complejas
- **Rationale**: Las funciones `search_*` usan `SECURITY DEFINER` para poder leer datos que el usuario con RLS restrictivo no podría ver directamente. El control de acceso se hace en la aplicación (middleware + server actions) en lugar de en cada query.

### D3: Soft delete universal
- **Rationale**: No se borran filas. El estado `Inactivo` (status_id=2) oculta registros de las búsquedas sin perder datos históricos ni referencias.
