## 1. Schema Base (schema.sql)

- [ ] 1.1 Add `locations` table with `IF NOT EXISTS` after `routes` section
- [ ] 1.2 Add `driver_checkpoints` table with `IF NOT EXISTS` after `locations`
- [ ] 1.3 Alter `routes` to add `origin_location_id`, `destination_location_id`, `waypoints` with `IF NOT EXISTS`
- [ ] 1.4 Add indexes for `locations(mapbox_place_id)`, `driver_checkpoints(load_id)`, `driver_checkpoints(recorded_at DESC)`
- [ ] 1.5 Verify `schema.sql` runs cleanly on fresh PostgreSQL database

## 2. Migration Upgrade (migration.sql)

- [ ] 2.1 Add `ALTER TABLE locations ENABLE ROW LEVEL SECURITY` with `IF NOT EXISTS` guard
- [ ] 2.2 Add `ALTER TABLE driver_checkpoints ENABLE ROW LEVEL SECURITY` with `IF NOT EXISTS` guard
- [ ] 2.3 Add RLS policies for `locations` (select) and `driver_checkpoints` (select, insert, update)
- [ ] 2.4 Add sequence sync for `locations` and `driver_checkpoints`
- [ ] 2.5 Verify `migration.sql` runs idempotently on database that already has tracking tables

## 3. TypeScript Types

- [ ] 3.1 Update `types/database.types.ts` to include `locations` and `driver_checkpoints` rows
- [ ] 3.2 Add `waypoints` JSONB type definition
- [ ] 3.3 Verify no TypeScript errors in `app/(dashboard)/traceability/page.tsx`

## 4. Validation

- [ ] 4.1 Run `npm run build` successfully
- [ ] 4.2 Start dev server and navigate to `/traceability` without 500 errors
- [ ] 4.3 Run `npm test` to ensure no regressions

## 5. Documentation

- [ ] 5.1 Commit with message: "sync(schema): align schema.sql with production tracking tables"
- [ ] 5.2 Push to `main`
- [ ] 5.3 Verify CI passes (if applicable)
