## ADDED Requirements

### Requirement: Locations table in base schema

Feature: schema.sql completeness
Rule: The base schema must define every table that the application expects at runtime.

#### Scenario: Fresh database has locations table
- **GIVEN** a new database created by running `supabase/schema.sql`
- **WHEN** the application queries the `locations` table
- **THEN** the table exists with columns: `location_id`, `formatted_address`, `street`, `city`, `state`, `zip`, `lat`, `lng`, `mapbox_place_id`, `source`, `status_id`, `created_at`

#### Scenario: Locations table is idempotent
- **GIVEN** a database where `locations` already exists
- **WHEN** `schema.sql` is executed again
- **THEN** no error is raised and existing data is preserved

#### Scenario: Locations has correct precision for coordinates
- **GIVEN** the `locations` table is created from `schema.sql`
- **WHEN** inspecting the `lat` and `lng` columns
- **THEN** `lat` is `NUMERIC(10,8)` and `lng` is `NUMERIC(11,8)`

#### Scenario: Locations has required indexes
- **GIVEN** the `locations` table exists
- **WHEN** querying by `mapbox_place_id`
- **THEN** an index on `mapbox_place_id` exists for fast lookup
