## MODIFIED Requirements

### Requirement: Routes table supports locations and waypoints

Feature: Route management with Mapbox integration
Rule: The `routes` table must support origin/destination via the `locations` table and multi-stop waypoints.

#### Scenario: Fresh database has extended routes columns
- **GIVEN** a new database created by running `supabase/schema.sql`
- **WHEN** the application creates a route with origin/destination locations and waypoints
- **THEN** the `routes` table has columns `origin_location_id`, `destination_location_id`, and `waypoints`

#### Scenario: Routes columns are idempotent
- **GIVEN** a database where `routes` already has the new columns
- **WHEN** `schema.sql` is executed again
- **THEN** no error is raised

#### Scenario: Routes waypoints default to empty array
- **GIVEN** the `routes` table is created from `schema.sql`
- **WHEN** inserting a route without waypoints
- **THEN** the `waypoints` column defaults to `'[]'::jsonb`

#### Scenario: Routes location columns reference locations table
- **GIVEN** the `routes` table exists
- **WHEN** setting origin or destination
- **THEN** `origin_location_id` and `destination_location_id` reference `locations(location_id)`
