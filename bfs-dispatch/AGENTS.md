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
```

No test framework is configured.

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
- `middleware.ts` — checks role via RPC; redirects to `/login?error=No role assigned` if no role, or `/dashboard?denied=1` if no access
- `hooks/use-has-access.ts` — `useHasAccess(module)` and `useUserRole()` hooks fetch role from DB
- `components/sidebar.tsx` — nav items filtered by role; hidden on `/login`
- `components/header.tsx` — sticky header with logo → `/dashboard` and home button; hidden on `/login`
- **Staff Management** (`/dashboard/human-resources`) — admin only: list employees, edit roles, toggle status

## Supabase

- Auth via `@supabase/ssr` cookie-based sessions
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local`, gitignored)
- Schema in `supabase/schema.sql` (base) + `supabase/migration.sql` (ALTERs) + `supabase/rbac-migration.sql` (RBAC, triggers, RPCs)
- **RLS is role-based**: employees/roles read for all authenticated, write for admin only; loads filtered by dispatcher_id or admin; sales/billing admin only
- **Status pattern**: `status_id` 1=Activo, 2=Inactivo, 3=Pendiente (from `record_status` seed)
- **Auth trigger** `handle_new_user()` — auto-creates employee record on signup, reads role from `user_metadata.role`
- **Schema drift**: `supabase/schema.sql` is stale. Always verify against live DB or migration files before writing queries.

## Key conventions

- **UI text is in Spanish** (labels, buttons, messages)
- **Zod v4** for validation — breaking changes from v3
- **Soft deletes**: set `status_id = 2` (Inactivo) instead of hard delete
- **Pagination**: 16 records/page across all list pages. Use `PaginationControls` + `TableSkeleton` components
- **`loads` page**: uses direct browser Supabase client + `search_loads` RPC, not server actions
- **New user setup**: after creating a user in Supabase Auth, ensure an `employees` record exists with `auth_user_id` linked and a valid `role_id`

## What's missing

- No test framework
- No CI/CD pipeline
- No database migration tooling (raw SQL files only)
- No TypeScript types generated from Supabase schema
