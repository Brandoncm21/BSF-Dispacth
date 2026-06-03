# BSF Dispatch — Agent Execution Prompt

> Este archivo contiene el prompt completo para que un agente OpenCode ejecute el refactoring de BSF Dispatch.
> Copiar y pegar en una nueva sesión de OpenCode después de leer REFACTOR_PLAN.md.

---

## Contexto

Eres un Senior Full-Stack Architect. Vas a ejecutar el refactoring de BSF Dispatch, un sistema de gestión de cargas de freight. El plan completo está en `REFACTOR_PLAN.md`.

**Stack:** Next.js 16.2.6, TypeScript strict, Supabase, Tailwind v4, shadcn/ui, Zod v4
**Repo:** https://github.com/Brandoncm21/BSF-Dispacth (branch `fixes`)
**Ruta local:** `C:\Users\malum\OneDrive\Documentos\GitHub\BSF Dispacth\bfs-dispatch`

## Estado actual

- `@supabase/ssr` ya instalado
- `@supabase/supabase-js` instalado como dependencia base
- Middleware ya corregido con patrón SSR (getUser + request.cookies + response)
- `lib/supabase-server.ts` y `lib/supabase-browser.ts` ya creados
- 19 índices ya migrados a la DB live
- `load_number` con secuencia atómica ya implementado
- PII ya limpiado de la historia de git
- RBAC completo: middleware + hooks + DB-level (RLS + funciones SECURITY DEFINER)
- 5 migraciones SQL nuevas ya aplicadas (indexes-timestamptz, view-update, rls-cleanup, storage-policies, create-route-function)

## Criterios de éxito por fase

Cada tarea debe pasar `npx tsc --noEmit` antes de continuar a la siguiente.

## FASE 2: FOUNDATION

### Task 2.1 — Centralizar clientes Supabase

**Archivos a modificar:**
1. `lib/auth-actions.ts` — reemplazar 3 `createServerClient()` inline con import de `createSupabaseServerClient()`
2. `hooks/use-loads.ts` — reemplazar `createBrowserClient()` inline con `createSupabaseBrowserClient()`
3. `app/(dashboard)/brokers/page.tsx` — reemplazar `createBrowserClient()` inline
4. `app/(dashboard)/carriers/page.tsx` — reemplazar `createBrowserClient()` inline
5. `app/(dashboard)/drivers/page.tsx` — reemplazar `createBrowserClient()` inline
6. `app/(dashboard)/reports/page.tsx` — reemplazar `createBrowserClient()` inline
7. `app/(dashboard)/dashboard/trucks/page.tsx` — reemplazar `createBrowserClient()` inline
8. `app/(dashboard)/dashboard/human-resources/page.tsx` — reemplazar `createBrowserClient()` inline

**NO tocar:** `middleware.ts` y `lib/actions.ts` (tienen contextos especiales)

**Verificación:** `npx tsc --noEmit` + grep para buscar `createBrowserClient|createServerClient` que no sea de `lib/supabase-*.ts`

### Task 2.2 — Error handling unificado

1. Mejorar `lib/errors.ts` con clase `AppError` que extiende `Error`
2. Crear `components/error-boundary.tsx`
3. Actualizar server actions para usar `AppError` consistentemente
4. Reemplazar `console.error` con error handling estructurado

### Task 2.3 — Modularizar lib/actions.ts (1165 líneas)

Crear directorio `lib/actions/` con módulos:
- `loads.ts` — operaciones de cargas
- `catalog.ts` — catálogos (estados, ciudades, calles)
- `routes.ts` — creación de rutas
- `documents.ts` — subida/descarga/borrado de documentos
- `fleet.ts` — flota (trucks, alerts, overview)
- `sales.ts` — analytics de ventas
- `trucks.ts` — CRUD de trucks
- `index.ts` — re-exports para backward compatibility

### Task 2.4 — Sincronizar schema.sql

Exportar schema actual de la DB live, comparar con schema.sql, y actualizar.

## FASE 3: MIGRATION

Migrar 6 páginas Client Component a Server Component:
- brokers, carriers, drivers, reports, dashboard/trucks, dashboard/human-resources
- Reemplazar `createBrowserClient` directo con server actions
- Las páginas load y traceability se quedan como Client Components

## FASE 4: TESTING

1. Instalar Vitest + React Testing Library + MSW
2. Unit tests: errors.ts, format.ts, constants.ts, roles.ts, utils.ts
3. Integration tests: server actions, middleware, RBAC
4. E2E: Playwright (login → dashboard → create load → logout)

## FASE 5: DEPLOYMENT

1. GitHub Actions CI workflow
2. Husky pre-commit hooks
3. Documentación (AGENTS.md, README.md)

---

## Reglas de oro

1. **Nunca** romper el build — si `tsc --noEmit` falla, revertir y reportar
2. **Nunca** borrar exports existentes sin verificar imports
3. **Backward compatibility primero** — barrel exports, después refactor
4. **Commits atómicos** — un commit por tarea, mensajes descriptivos
5. **Push frecuente** — hacer push a `origin/fixes` después de cada tarea completada
