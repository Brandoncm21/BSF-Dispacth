# BSF Dispatch — Refactor Plan

> **Target:** 7.5/10 → 9.5/10
> **Stack:** Next.js 16.2.6, TypeScript strict, Supabase, Tailwind v4, shadcn/ui, Zod v4
> **Repo:** https://github.com/Brandoncm21/BSF-Dispacth (branch `fixes`)

---

## Status Overview

| Phase | Est. | Status |
|-------|------|--------|
| **1. PLANNING** | 2-3h | ✅ Complete |
| **2. FOUNDATION** | 6-8h | 🔴 Not started |
| **3. MIGRATION** | 12-16h | 🔴 Not started |
| **4. TESTING** | 8-10h | 🔴 Not started |
| **5. DEPLOYMENT** | 3-4h | 🔴 Not started |
| **Total** | **31-38h** | |

---

## Phase 1: PLANNING (COMPLETE)

### Deliverables
- [x] Architecture analysis
- [x] Client duplication inventory (71 instances, 4 patterns)
- [x] Error handling fragmentation (49 try/catch, no boundary)
- [x] Test coverage audit (0%)
- [x] Database schema drift assessment
- [x] This document

### Architecture Summary

```
src/
├── app/          13 pages (12 Client Components, 1 Server Component)
├── lib/          8 utility files (1 file = 1165 lines)
├── components/   22 components (1 shadcn/ui subdirectory)
├── hooks/        2 hooks
├── types/        2 type definition files
├── config/       1 RBAC config
└── supabase/     9 SQL migration files
```

All files are flat. No subdirectories for organization.

---

## Phase 2: FOUNDATION

### Task 2.1 — Centralize Supabase Clients (2h)

**Problem:** 4 distinct client creation patterns across 11 files.
**Solution:** Single source of truth for each client type.

**Files to modify:**
- `hooks/use-loads.ts` (line 9-12) → import `createSupabaseBrowserClient()`
- `app/(dashboard)/brokers/page.tsx` (line 23) → import `createSupabaseBrowserClient()`
- `app/(dashboard)/carriers/page.tsx` (line 6) → import `createSupabaseBrowserClient()`
- `app/(dashboard)/drivers/page.tsx` (line 6) → import `createSupabaseBrowserClient()`
- `app/(dashboard)/reports/page.tsx` (line 6) → import `createSupabaseBrowserClient()`
- `app/(dashboard)/dashboard/trucks/page.tsx` (line 15) → import `createSupabaseBrowserClient()`
- `app/(dashboard)/dashboard/human-resources/page.tsx` (line 30) → import `createSupabaseBrowserClient()`
- `lib/auth-actions.ts` (lines 9, 47, 74) → import `createSupabaseServerClient()` instead of reinventing

**Keep as-is (correct patterns):**
- `middleware.ts` — Edge Runtime context, cannot use imported clients
- `lib/actions.ts` — `getSupabaseServerClient()` with built-in auth check

### Task 2.2 — Unified Error Handling (2h)

**Problem:** `lib/errors.ts` exists but is barely used.
**Solution:** Make `AppError` the universal error type across the app.

**Changes:**
- Enhance `lib/errors.ts` with `AppError` class
- Create `components/error-boundary.tsx`
- Create `hooks/use-api-error.ts`
- Update all server actions to throw `AppError` instead of `{ error: string }`

**Files to create:**
- `components/error-boundary.tsx`
- `hooks/use-api-error.ts`

**Files to modify:**
- `lib/errors.ts` (enhance)
- `lib/actions.ts` (update error patterns)
- All page components (use new error hook)

### Task 2.3 — Modularize lib/actions.ts (3h)

**Problem:** 1 file, 1165 lines, 38 functions.
**Solution:** Split into domain modules.

**New structure:**
```
lib/actions/
├── index.ts          # Re-exports all for backward compatibility
├── loads.ts          # createLoad, updateLoad, deleteLoad, updateLoadStatus
├── catalog.ts        # getStates, getCities, searchAddresses, getOrCreateCity/Street
├── routes.ts         # createRoute + helpers
├── documents.ts      # upload, get, getSignedUrl, delete documents
├── fleet.ts          # getFleetAlerts, getFleetOverview, getTruckLoadHistory
├── sales.ts          # getSalesAnalytics
└── trucks.ts         # createTruck, updateTruck, updateTruckStatus
```

**Note:** `getSupabaseServerClient()` stays in `lib/actions/index.ts` and is imported by all modules.

### Task 2.4 — Sync schema.sql (1h)

**Problem:** Base schema doesn't reflect current DB state.
**Solution:** Regenerate schema.sql from live Supabase database.

**Approach:** Export current schema using `supabase db dump` or manual reconciliation.

---

## Phase 3: MIGRATION

### Task 3.1 — Server Component Migration (6h)

**Pages to migrate from Client → Server:**

| File | Current Lines | Pattern | Est. |
|------|---------------|---------|------|
| `brokers/page.tsx` | ~120 | inline createBrowserClient + direct queries | 1h |
| `carriers/page.tsx` | ~250 | inline createBrowserClient + direct queries | 1h |
| `drivers/page.tsx` | ~140 | inline createBrowserClient + direct queries | 1h |
| `reports/page.tsx` | ~140 | inline createBrowserClient + direct queries | 1.5h |
| `dashboard/trucks/page.tsx` | ~120 | inline createBrowserClient + direct queries | 1h |
| `dashboard/human-resources/page.tsx` | ~180 | inline createBrowserClient + RPC calls | 1.5h |

**Keep as Client Components:**
- `loads/page.tsx` (164 lines, uses `useLoads()` hook, reactive search/filters)
- `traceability/page.tsx` (190 lines, real-time fleet tracking)

### Task 3.2 — Optimize next.config.ts (0.5h)

**Current:** Empty config.
**Add:** Image remote patterns, ESLint config.

---

## Phase 4: TESTING

### Task 4.1 — Testing Infrastructure (1h)
- Install Vitest + React Testing Library + MSW
- Configure `vitest.config.ts`
- Add test scripts

### Task 4.2 — Unit Tests (3h)
- `lib/errors.ts` — 100%
- `lib/format.ts` — 100%
- `lib/constants.ts` — 100%
- `config/roles.ts` — 100%
- `lib/utils.ts` — 100%

### Task 4.3 — Integration Tests (4h)
- All server actions with MSW
- Middleware auth flow
- RBAC permission matrix

### Task 4.4 — E2E Tests (2h)
- Playwright: login → dashboard → create load → logout
- Role-based access testing

---

## Phase 5: DEPLOYMENT

### Task 5.1 — CI/CD (1h)
- GitHub Actions workflow
- Branch protection

### Task 5.2 — Git Hooks (0.5h)
- Husky + lint-staged
- Pre-commit: lint + typecheck
- Pre-push: tests

### Task 5.3 — Documentation (1h)
- Update AGENTS.md
- Update README.md

---

## Success Criteria

### Compilation
```bash
npx tsc --noEmit  # Must pass with 0 errors
npm run build      # Must succeed (production build)
npm run lint       # Must pass (0 errors)
```

### Quality
- [ ] 100% of client creation via `lib/supabase-*.ts`
- [ ] 0 unused imports/variables
- [ ] All server actions throw `AppError`
- [ ] `lib/actions/` modularized (no single file >200 lines)
- [ ] 80%+ test coverage

### Security
- [ ] No `@supabase/supabase-js` imports in app code
- [ ] Middleware uses `getUser()` not `getSession()`
- [ ] RBAC enforced in middleware + DB + hooks

---

## Execution Order

```
Phase 2.1 → Phase 2.2 → Phase 2.3 → Phase 2.4
         ↘              ↘
    Phase 3.1       Phase 3.2
              ↘
          Phase 4.1 → 4.2 → 4.3 → 4.4
              ↘
          Phase 5.1 → 5.2 → 5.3
```

Each phase must complete all tasks before the next begins. Each task must pass `tsc --noEmit` before advancing.
