# ADR-012: Testing Infrastructure and Pure Function Extraction

## Status
Accepted

## Context

El proyecto no tenía tests automatizados. La lógica de negocio (cálculo de dispatch fees, profit, formateo de fechas/monedas, validaciones) estaba acoplada a componentes React y server actions, haciéndola imposible de testear sin montar el entorno completo de Next.js. Los errores de cálculo solo se detectaban en producción.

## Decision

Adoptar **Vitest** como test runner e implementar una estrategia de testing en tres capas:

### Capa 1: Funciones puras (`lib/calculations.ts`)

Extraer toda la lógica matemática sin dependencias externas a `lib/calculations.ts`:

```ts
export function calculateDispatchFee(rate: number, dispatchFeePct: number): number
export function calculateNetProfit(rate: number, dispatchFee: number): number
```

Estas funciones son **puras**: mismo input → mismo output, sin side effects, sin imports de Supabase o React. Se testean con asserts simples de Vitest.

### Capa 2: Utilidades formateadoras (`lib/format.ts`, `lib/constants.ts`, `lib/errors.ts`)

Funciones de formato (`formatUSD`, `formatTimestamp`, `toDatetimeLocal`), constantes de negocio (`LOAD_STATUS`, `PAID_STATUS` con labels/colores/transiciones), y manejo de errores (`AppError`, `parseSupabaseError`). Todas sin dependencias externas.

### Capa 3: Mocks globales de Supabase (`tests/setup.ts`)

Se mockea `@supabase/ssr` y `@/lib/actions/core` a nivel de módulo usando `vi.mock()`:

- `createBrowserClient` y `createServerClient` retornan un **mock client** con `auth` (getSession, getUser, signOut), `from()` (query builder encadenable), `rpc()`, y `channel()` (broadcast).
- `getSupabaseServerClient` retorna el mismo mock, permitiendo testear server actions sin conexión real a Supabase.

Esto permite testear hooks (`useLoads`) y componentes sin levantar una base de datos.

### Configuración

```ts
// vitest.config.ts
{
  environment: "jsdom",
  globals: true,
  setupFiles: ["./vitest.setup.ts", "./tests/setup.ts"],
  coverage: { provider: "v8", reporter: ["text", "json", "html"] }
}
```

## Consequences

- ✅ `lib/calculations.ts` es testeable con 0 mocks, 0 setup — tests instantáneos (<1ms).
- ✅ La lógica de negocio está protegida contra regresiones sin depender de infraestructura.
- ✅ Los mocks globales de Supabase evitan configuraciones repetitivas de `vi.mock` en cada test.
- ✅ Coverage report habilita tracking de calidad a futuro (thresholds al 80% planeados).
- ✅ `jsdom` permite testear hooks React y componentes con `@testing-library/react`.
- ⚠️ Los mocks de Supabase son **manuales**: requieren mantenerse sincronizados con la API de `@supabase/ssr`. Si Supabase cambia la firma del query builder, los tests pasarán en verde pero podrían fallar en runtime.
- ⚠️ No hay tests de integración end-to-end (E2E) — solo unitarios y de componentes.

## Roadmap: Migración a MSW

**Estado actual:** `msw` está instalado como devDependency (`v2.14.6`) pero **no está configurado**. El mock actual de Supabase usa `vi.mock()` manual en `tests/setup.ts`.

**Intención:** Migrar progresivamente a **Mock Service Worker (MSW)** para interceptar peticiones HTTP a nivel de red en lugar de mockear módulos. Esto ofrece:

- **Realismo**: Las peticiones fetch reales de `@supabase/ssr` se interceptan, no se reemplazan.
- **Debugging**: Las peticiones aparecen en DevTools Network tab durante los tests.
- **Reutilización**: Los mismos handlers sirven para tests unitarios, de integración y desarrollo local.
- **Independencia**: No hay riesgo de desincronización con la API interna de Supabase.

Plan tentativo:
1. Crear handlers MSW que emulen las respuestas JSON de la REST API de Supabase (`/rest/v1/loads`, `/rest/v1/routes`, etc.) y PostgREST RPC (`/rest/v1/rpc/search_loads`).
2. Configurar `msw/node` en `vitest.config.ts` como `server` setup.
3. Migrar tests existentes del mock manual a MSW handlers.
4. Retirar `vi.mock("@supabase/ssr")` cuando todos los tests usen MSW.

## Related
- ADR-010: Server Actions domain separation
- ADR-011: Supabase browser client Singleton
