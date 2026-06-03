<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BFS Dispatch (BestFreight)

Next.js 16.2.6 App Router + Supabase freight dispatch management app.

## Commands

```
npm run dev       # dev server (localhost:3000)
npm run build     # production build
npm run start     # start production server
npm run lint      # eslint (next/core-web-vitals + typescript)
npm run test      # vitest run (unit + integration tests)
npm run test:watch  # vitest watch mode
```

## Route Structure (Route Groups)

- `app/(auth)/login/page.tsx` → `/login` — no Sidebar/Header
- `app/(dashboard)/layout.tsx` — single shell: `<Sidebar>` + `<Header>` + `<main>`
- `app/(dashboard)/dashboard/page.tsx` → `/dashboard`
- `app/(dashboard)/dashboard/trucks/page.tsx` → `/dashboard/trucks`
- `app/(dashboard)/dashboard/human-resources/page.tsx` → `/dashboard/human-resources`
- `app/(dashboard)/{drivers,carriers,brokers,loads,reports,traceability}/page.tsx` → `/{drivers,carriers,brokers,loads,reports,traceability}`
- Root `app/layout.tsx` is minimal: fonts + HTML/body only. No Sidebar/Header here.

**Never** render `<Sidebar>` or `<Header>` inside individual pages — they come from `app/(dashboard)/layout.tsx`.

## RBAC System

- Roles defined in `config/roles.ts`: admin, back_office, dispatcher, logistics, sales
- Role stored in DB: `employees.role_id` → `roles.role_type`
- `get_user_role_type()` RPC (SECURITY DEFINER) — single source of truth for role checks, bypasses RLS
- `middleware.ts` — uses `@supabase/ssr` Edge pattern (`request.cookies`, `response.cookies`); checks role via `get_user_role_type()` RPC
- `hooks/use-has-access.ts` — `useHasAccess(module)` and `useUserRole()` hooks fetch role from DB
- `components/sidebar.tsx` — nav items filtered by role; hidden on `/login`
- `components/header.tsx` — sticky header with logo → `/dashboard` and home button; hidden on `/login`
- **Staff Management** (`/dashboard/human-resources`) — admin only: list employees, edit roles, toggle status

## Supabase Client Pattern

**3 client factories only — no inline creation:**

| Factory | File | When to Use |
|---------|------|-------------|
| `createSupabaseServerClient()` | `lib/supabase-server.ts` | Server Components, server actions (no auth check) |
| `createSupabaseBrowserClient()` | `lib/supabase-browser.ts` | Client Components (browser-side queries, RPCs) |
| `getSupabaseServerClient()` | `lib/actions/core.ts` | Server actions (includes auth check — throws if no user) |
| Inline `createServerClient()` | `middleware.ts` | Edge Runtime (must use `request.cookies` API) |

**Legacy** `lib/supabase.ts` exists for backward compatibility — do NOT import from it in new code.

## Server Actions

All server actions live in `lib/actions/` directory:

```
lib/actions/
├── core.ts       — getSupabaseServerClient() helper
├── loads.ts      — createLoad, updateLoad, deleteLoad, updateLoadStatus
├── catalog.ts    — getStates, cities, carriers, drivers, roles CRUD
├── routes.ts     — route CRUD, getOrCreate operations
├── documents.ts  — document upload/download/delete
├── sales.ts      — getSalesAnalytics
└── fleet.ts      — fleet tracking, truck CRUD, broker CRUD
```

**Barrel file:** `lib/actions.ts` re-exports everything. Import from `@/lib/actions` as before.

## Error Handling

- `lib/errors.ts` — `AppError` class (extends `Error`) with optional `code` and `field` properties
- `components/error-boundary.tsx` — React Error Boundary for client components
- `hooks/use-api-error.ts` — `useApiError()` hook for client-side error state
- All server actions throw errors; client components catch with `try/catch`

## Testing

- Vitest v4 with jsdom environment
- Tests live alongside source files: `*.test.ts`, `*.test.tsx`
- Run `npm test` or `npx vitest run`

## Database Schema

- `supabase/schema.sql` — base schema (CREATE TABLEs, seed data, views)
- `supabase/migration.sql` — ALTER TABLEs, new tables, RLS policies, load_number sequence
- `supabase/rbac-migration.sql` — RBAC system (role types, auth trigger, RPCs)
- `supabase/rls-cleanup-migration.sql` — fixed overly permissive policies
- `supabase/storage-policies-migration.sql` — storage bucket policies
- `supabase/create-route-function-migration.sql` — SQL functions for atomic route creation
- `supabase/indexes-timestamptz-migration.sql` — 19 FK indexes + TIMESTAMPTZ fix
- `supabase/view-update-migration.sql` — updated trucks_with_availability view
- **Schema drift**: `schema.sql` is now synced with live DB (added missing tables, columns, triggers, views)

## Key conventions

- **UI text is in Spanish** (labels, buttons, messages)
- **Zod v4** for validation — breaking changes from v3
- **Soft deletes**: set `status_id = 2` (Inactivo) instead of hard delete
- **Pagination**: 16 records/page across all list pages. Use `PaginationControls` + `TableSkeleton` components
- **`loads` page**: uses `useLoads()` hook with browser Supabase client + `search_loads` RPC for reactive UX; mutations via server actions
- **New user setup**: after creating a user in Supabase Auth, ensure an `employees` record exists with `auth_user_id` linked and a valid `role_id`
- **`load_number` generation**: uses `loads_seq` PostgreSQL sequence + trigger (atomic, no race condition)
- **`dispatch_fee`**: always computed server-side from `dispatch_fee_pct * rate / 100`

## What's still missing

- Database migration tooling (raw SQL files only)
- TypeScript types generated from Supabase schema (current `types/database.types.ts` is manually maintained)
- Integration tests for server actions (Vitest + MSW not yet configured for API mocking)
- E2E tests (Playwright not installed)

- 2026-05-26: Fixed timezone bug in reports.ts, analytics.ts — getDateRange now accepts client tzOffsetMinutes, formats ISO strings with timezone offset, filters on raw TIMESTAMPTZ without ::date cast. Fixed get_truck_load_history INNER JOIN → LEFT JOIN. Added idx_loads_effective_date expression index.
- 2026-05-26: Created Executive Dashboard (/dashboard/executive) with 13 preset period filters, YoY comparison for quarterly/semestral/annual, KPI cards with sparklines (Recharts AreaChart 60px), Revenue vs Profit bar chart, period selector dropdown, print CSS for US Letter PDF export, and v_executive_bi_metrics view. Restricted to admin, back_office, sales roles.
