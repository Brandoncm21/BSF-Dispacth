## ADDED Requirements

### Requirement: Driver checkpoints table in base schema

Feature: schema.sql completeness
Rule: The base schema must define every table that the application expects at runtime.

#### Scenario: Fresh database has driver_checkpoints table
- **GIVEN** a new database created by running `supabase/schema.sql`
- **WHEN** the application inserts a driver checkpoint
- **THEN** the table exists with columns: `checkpoint_id`, `load_id`, `driver_id`, `lat`, `lng`, `recorded_at`, `status_at_checkpoint`, `notes`, `created_by`

#### Scenario: Checkpoints table is idempotent
- **GIVEN** a database where `driver_checkpoints` already exists
- **WHEN** `schema.sql` is executed again
- **THEN** no error is raised and existing data is preserved

#### Scenario: Checkpoints has correct precision for coordinates
- **GIVEN** the `driver_checkpoints` table is created from `schema.sql`
- **WHEN** inspecting the `lat` and `lng` columns
- **THEN** both are `NUMERIC(10,8)` and `NUMERIC(11,8)` respectively

#### Scenario: Checkpoints has required indexes
- **GIVEN** the `driver_checkpoints` table exists
- **WHEN** querying checkpoints by load or by time
- **THEN** indexes exist on `load_id` and `recorded_at DESC`

#### Scenario: Checkpoints has foreign keys
- **GIVEN** the `driver_checkpoints` table exists
- **WHEN** inserting a checkpoint
- **THEN** `load_id` references `loads(load_id)` with `ON DELETE CASCADE`, `driver_id` references `drivers(driver_id)` with `ON DELETE SET NULL`, `created_by` references `employees(employee_id)` with `ON DELETE SET NULL`
