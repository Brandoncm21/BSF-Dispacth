# ADR-011: Supabase Browser Client — Singleton Pattern

## Status
Accepted

## Context

Cada Client Component que necesitaba acceso a Supabase (hooks `useLoads`, `NotificationBell`, `Header`, `LoadForm`, `TrackingMap`) llamaba a `createBrowserClient()` en cada render. Esto generaba:

- **Múltiples listeners de auth**: Cada instancia de `createBrowserClient` registra un listener `onAuthStateChange`. Con 5+ componentes usando el cliente, había 5+ listeners activos simultáneamente.
- **Fugas de memoria**: Los listeners no se desuscribían al desmontar componentes que usaban `useEffect` con el cliente como dependencia.
- **Sesiones inconsistentes**: Cada instancia podía leer una cookie en un estado distinto durante navegaciones rápidas.
- **Sobrecarga de red**: Refresh tokens se rotaban múltiples veces innecesariamente.

## Decision

Implementar **Singleton Pattern** en `lib/supabase-browser.ts`. Una única instancia de `createBrowserClient` se crea en la primera llamada y se reutiliza en todos los componentes:

```ts
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
```

La función se exporta como `createSupabaseBrowserClient` y todos los Client Components la importan desde `@/lib/supabase-browser`.

## Consequences

- ✅ Un solo listener `onAuthStateChange` para toda la aplicación — estado de sesión consistente.
- ✅ Sin fugas de memoria por listeners huérfanos al desmontar componentes.
- ✅ Una sola rotación de refresh token por ciclo de vida de sesión.
- ✅ Menor overhead de inicialización del cliente Supabase.
- ✅ Compatible con React Strict Mode (doble render en desarrollo no crea doble instancia).
- ⚠️ El Singleton es module-scoped: en SSR (Server Components) no aplica porque el módulo no se ejecuta en el servidor.
- ⚠️ Si se necesita un cliente sin sesión (ej: página de registro), se debe usar `createSupabaseServerClient` de `lib/supabase-server.ts` en su lugar.
- ⚠️ En tests, el mock de `createBrowserClient` en `tests/setup.ts` reemplaza el Singleton — no hay riesgo de estado compartido entre pruebas.

## Side-by-Side: Server vs Browser Clients

| Cliente | Archivo | Patrón | Usa cookies? | Verifica auth? | Usado por |
|---------|---------|--------|-------------|----------------|-----------|
| Browser Client | `lib/supabase-browser.ts` | **Singleton** | Sí (automático) | No (cliente público) | Client Components |
| Server Action Client | `lib/actions/core.ts` | **Factory** (nueva instancia por request) | Sí (`next/headers`) | Sí (`getUser()`) | Server Actions |
| Server Auth Client | `lib/supabase-server.ts` | **Factory** | Sí (`next/headers`) | No | `auth-actions.ts`, `middleware.ts` |

## Related
- ADR-010: Server Actions domain separation
- ADR-012: Testing infrastructure and pure functions
