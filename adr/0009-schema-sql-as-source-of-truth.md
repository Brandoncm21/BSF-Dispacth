# ADR-0009: schema.sql as Single Source of Truth for New Deployments

## Status

accepted

## Context

The project maintains database schema through two channels:
1. `supabase/schema.sql` — intended as the base schema for fresh deployments
2. `supabase/migration.sql` — ALTER TABLEs and new tables for existing deployments

Over time, migrations added tables (`locations`, `driver_checkpoints`) and columns (`routes.waypoints`, `routes.origin_location_id`, `routes.destination_location_id`) that were never back-ported to `schema.sql`. This causes:

- New developers running `schema.sql` on a fresh database to encounter "table does not exist" errors when the app code references these tables
- CI/CD pipelines that reset the database to fail
- SaaS multi-tenant provisioning scripts to break

## Decision

`schema.sql` must remain the **single source of truth** for what a fresh database looks like. Every structural change applied via migration must eventually be back-ported to `schema.sql`.

Implementation rule:
- New tables: add `CREATE TABLE IF NOT EXISTS` to `schema.sql`
- New columns: add `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to `schema.sql`
- Indexes: add `CREATE INDEX IF NOT EXISTS` to `schema.sql`
- RLS policies: add to `migration.sql` (upgrade path) but also document in `schema.sql` comments

`migration.sql` remains the upgrade path for existing databases.

## Consequences

- **Positive**: Fresh deployments always match production schema
- **Positive**: Onboarding new developers becomes deterministic
- **Negative**: Slight duplication between `schema.sql` and `migration.sql` (acceptable trade-off)
- **Negative**: Requires discipline to back-port after each migration (mitigated by this ADR)

## Compliance

To check compliance, run:
```bash
psql -f supabase/schema.sql -d fresh_db
# Then verify the app starts without "relation does not exist" errors
```

## Related

- ADR-0007: use-denormalized-locations-table (locations table was introduced here)
- ADR-0008: mapbox-directions-api-for-real-route-lines (waypoints column introduced here)
