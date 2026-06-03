## Context

`schema.sql` was created as the base schema but has not been maintained in sync with production migrations. Production has:

- `locations` table (added via migration, used by routes and tracking)
- `driver_checkpoints` table (added via migration, used by traceability page)
- `routes.waypoints`, `routes.origin_location_id`, `routes.destination_location_id` (added via migration)

Meanwhile `schema.sql` defines `routes` with only the original columns (`origin_address_id`, `destination_address_id`), and completely omits `locations` and `driver_checkpoints`.

This drift was discovered when onboarding a new developer whose fresh database failed to run the app.

## Goals / Non-Goals

**Goals:**
- Make `schema.sql` a complete, runnable base schema
- Ensure idempotency so `schema.sql` can run on both fresh and existing databases
- Document the schema-sync discipline for future changes

**Non-Goals:**
- Refactoring existing migrations
- Changing production data or schema
- Adding new application features (only schema alignment)

## Decisions

1. **Use `IF NOT EXISTS` everywhere**
   - Rationale: Allows `schema.sql` to run safely on databases that already have some or all of these objects via prior migrations.
   - Alternative considered: Separate `schema-v2.sql` — rejected because it fragments the base schema source of truth.

2. **Normalize `lat`/`lng` to `NUMERIC(10,8)` and `NUMERIC(11,8)`**
   - Rationale: ±1.1m precision is sufficient for GPS, reduces storage, improves index performance, aligns with ISO 19125.
   - Alternative considered: Copy exact `NUMERIC` from production — rejected because production used generic precision without intent.

3. **`driver_checkpoints` includes `driver_id` and `created_by`**
   - Rationale: Production has both columns with FKs. `driver_id` identifies who drove; `created_by` identifies who reported (employee or dispatcher). `ON DELETE SET NULL` preserves history if a driver or employee is soft-deleted.

4. **RLS policies go in `migration.sql`, not `schema.sql`**
   - Rationale: `schema.sql` is for structural schema; `migration.sql` is for access control upgrades. This matches the existing convention where `schema.sql` ends with a generic "Allow authenticated access" policy block and `migration.sql` contains granular policies.

## Risks / Trade-offs

- [Risk] `schema.sql` and `migration.sql` will overlap on column additions → Mitigation: `IF NOT EXISTS` prevents runtime conflicts
- [Risk] Future drift if developers forget to back-port → Mitigation: ADR-0009 records the discipline requirement
- [Risk] `driver_checkpoints` uses `INTEGER GENERATED ALWAYS AS IDENTITY` while production may have used `nextval` on a sequence → Mitigation: Use `GENERATED ALWAYS AS IDENTITY` in `schema.sql` (modern PostgreSQL best practice); `migration.sql` already created it correctly

## Migration Plan

1. Review these artifacts
2. Apply changes to `schema.sql` and `migration.sql`
3. Run `psql -f supabase/schema.sql -d test_db` on a fresh local database
4. Start the app and verify `/traceability` loads without errors
5. Run `supabase/migration.sql` on a production clone to verify idempotency
6. Commit, push, and update onboarding docs

## Open Questions

- Should we add a CI step that runs `schema.sql` in a container on every PR to prevent future drift?
- Should `locations.lat`/`lng` allow NULL? The app may create a location before geocoding completes. Current proposal marks them `NOT NULL` but the app could be updated to enforce geocoding before save.
