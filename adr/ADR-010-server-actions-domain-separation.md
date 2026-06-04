# ADR-010: Server Actions Domain Separation — Monolithic Barrel vs Domain Modules

## Status
Accepted

## Context

El proyecto creció de 3 operaciones CRUD a más de 70 server actions distribuidas en 9 dominios de negocio (loads, routes, fleet, catalog, tracking, notifications, documents, sales, analytics). Inicialmente todas se definían en un único archivo `lib/actions.ts`. Esto violaba el Principio de Responsabilidad Única (SRP) y dificultaba:

- **Navegación**: Un solo archivo con 500+ líneas mezclando dominios.
- **Testing**: Imposible mockear por dominio sin afectar otros.
- **Code Review**: Cada PR tocaba el mismo archivo, generando conflictos frecuentes.
- **Tree-shaking**: El bundler incluía todo aunque solo se usara una acción.

## Decision

Separar en 12 archivos dentro de `lib/actions/` — uno por dominio — y mantener `lib/actions.ts` como **barrel file** que solo re-exporta la API pública:

```
lib/actions/
  core.ts           Fábrica del cliente Supabase autenticado (getSupabaseServerClient)
  loads.ts          CRUD de cargas + búsqueda
  routes.ts         CRUD de rutas + cálculo Mapbox Directions
  locations.ts      Búsqueda/upsert de ubicaciones por Mapbox place_id
  catalog.ts        Catálogos maestros (carriers, drivers, trucks, brokers, cities)
  fleet.ts          Gestión de flota + brokers + mantenimiento
  tracking.ts       Checkpoints GPS + tracking público
  notifications.ts  Notificaciones in-app + Supabase Realtime
  documents.ts      Upload/descarga de documentos en Supabase Storage
  sales.ts          Analítica de ventas (v_sales_performance)
  reports.ts        Reportes agrupados por dispatcher/carrier
  analytics.ts      Dashboard KPIs + rankings
```

Cada archivo es un módulo `"use server"` independiente. `core.ts` centraliza la creación del cliente Supabase autenticado vía cookies. Los Client Components importan exclusivamente desde `@/lib/actions` (el barrel).

## Consequences

- ✅ Cada dominio puede evolucionar, testearse y revisarse de forma aislada.
- ✅ Conflictos de merge eliminados: 12 archivos pequeños en vez de 1 archivo grande.
- ✅ Tree-shaking efectivo: solo se carga el módulo que se usa.
- ✅ El barrel file actúa como contrato público: migraciones internas no rompen consumers.
- ✅ `core.ts` como single source of truth para la creación del cliente Supabase server-side.
- ⚠️ Las dependencias circulares entre dominios requieren disciplina (ej: `sales.ts` depende de tipos de `fleet.ts`, pero la importación es solo de tipos, no de runtime).
- ⚠️ Agregar un nuevo dominio requiere: (1) crear archivo en `lib/actions/`, (2) agregar re-export en `lib/actions.ts`, (3) actualizar `database.types.ts` si hay queries nuevas.
- ⚠️ Las funciones de autenticación (`login`, `logout`) permanecen en `lib/auth-actions.ts` fuera del barrel porque usan `redirect()` de Next.js (incompatible con el patrón de retorno `{ success, data }` del resto).

## Implementation Notes

- **Validación dual**: Zod schemas en cada archivo de acción (server-side) + schemas en `types/` (client-side).
- **Patrón de retorno**: Mutaciones retornan `{ success: true, data }` o `{ error: string, errors?: Record }`. Lecturas lanzan errores (manejados por React Error Boundaries).
- **Funciones deprecadas**: Las funciones legacy (`getOrCreateAddress`, `getOrCreateCity`, `searchStreets`) se mantienen en `routes.ts` con throws explícitos redirigiendo a `locations.ts`.

## Related
- ADR-0007: Denormalized locations table
- ADR-0011: Supabase browser client Singleton
