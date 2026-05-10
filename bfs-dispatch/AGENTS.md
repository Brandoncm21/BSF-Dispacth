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

## Architecture

- **App Router** with routes: `/` (redirects `/login`), `/login`, `/dashboard`, `/loads`, `/carriers`, `/drivers`, `/reports`
- **Protected routes** via `middleware.ts`: `/dashboard`, `/loads`, `/carriers`, `/drivers`, `/reports` — redirects unauthenticated to `/login?redirect=<path>`
- **Dashboard layout** (`app/dashboard/layout.tsx`) wraps all dashboard pages with `<Sidebar>`
- **Server actions**: `lib/auth-actions.ts` (login/logout), `lib/actions.ts` (CRUD helpers for loads, addresses, routes, carriers, drivers, trucks, brokers, cargo types, special requirements)
- **Browser client**: `lib/supabase.ts` exports `createClient()` and a pre-created `supabase` instance
- **UI**: shadcn/ui (new-york style) in `components/ui/`, custom `components/sidebar.tsx` and `components/address-modal.tsx`
- **Styling**: Tailwind CSS v4 with `@import "tailwindcss"` in `app/globals.css`, oklch color tokens, dark mode support
- **Path alias**: `@/*` maps to root (`tsconfig.json`)

## Supabase

- Auth via `@supabase/ssr` cookie-based sessions
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local`, gitignored)
- Schema in `supabase/schema.sql` — includes tables, seed data, views, and RLS policies
- **RLS**: all tables have `"Allow authenticated access"` policy (full CRUD for authenticated users)
- **Status pattern**: `status_id` 1=Activo, 2=Inactivo, 3=Pendiente (from `record_status` seed)
- **Schema drift warning**: `supabase/schema.sql` may not reflect current DB state. The `loads` table has additional columns not in the schema file: `load_number`, `rate`, `dispatch_fee`, `factoring`, `load_status`, `paid_status`. Always verify against the live DB or `supabase/migration.sql` before writing queries.

## Key conventions

- **UI text is in Spanish** (labels, buttons, messages)
- **Zod v4** for validation (`lib/actions.ts`, `app/loads/page.tsx`) — breaking changes from v3
- **Load creation** (`lib/actions.ts:createLoad`): auto-generates `load_number` as `LD-<year>-<seq>`, calculates `dispatch_fee` as 20% of rate, links to `employees` via `auth_user_id`
- **Soft deletes**: set `status_id = 2` (Inactivo) instead of hard delete
- **`loads` page inconsistency**: `app/loads/page.tsx` uses direct browser Supabase client for CRUD instead of server actions in `lib/actions.ts`. The server action `createLoad` is not used by the loads page.

## What's missing

- No test framework
- No CI/CD pipeline
- No database migration tooling (raw SQL files only)
- No type generation from Supabase schema
