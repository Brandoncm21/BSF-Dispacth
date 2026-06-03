# Proposal: Sync Schema Tracking Tables

## Why

`supabase/schema.sql` is missing tables and columns that exist in production, causing fresh database setups to fail with "relation does not exist" errors. This blocks new developers, CI/CD, and SaaS tenant provisioning.

## What Changes

- **BREAKING**: None (only additive to `schema.sql`)
- Add `locations` table to `schema.sql`
- Add `driver_checkpoints` table to `schema.sql`
- Add `waypoints`, `origin_location_id`, `destination_location_id` columns to `routes` in `schema.sql`
- Add RLS policies for `locations` and `driver_checkpoints` to `migration.sql`
- Add sequence sync for new tables to `migration.sql`
- Update `types/database.types.ts` to reflect schema accurately

## Capabilities

- **New Capabilities**:
  - `schema-sync-locations`: `locations` table in base schema
  - `schema-sync-checkpoints`: `driver_checkpoints` table in base schema
  - `schema-sync-routes`: `routes` column extensions in base schema
  - `schema-sync-rls`: RLS policies for tracking tables

- **Modified Capabilities**: None

## Impact

- `supabase/schema.sql`
- `supabase/migration.sql`
- `types/database.types.ts`
- Onboarding docs (indirect)
