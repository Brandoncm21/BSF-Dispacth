## ADDED Requirements

### Requirement: Tracking tables have RLS policies

Feature: Row Level Security coverage
Rule: Every table accessible by the application must have RLS enabled with appropriate policies.

#### Scenario: Locations has RLS enabled
- **GIVEN** the `locations` table exists
- **WHEN** checking RLS status
- **THEN** RLS is enabled and authenticated users can select rows

#### Scenario: Driver checkpoints has RLS enabled
- **GIVEN** the `driver_checkpoints` table exists
- **WHEN** checking RLS status
- **THEN** RLS is enabled and authenticated users can select, insert, and update rows

#### Scenario: Existing databases get RLS via migration
- **GIVEN** an existing database without RLS on tracking tables
- **WHEN** running `supabase/migration.sql`
- **THEN** RLS is enabled and policies are created idempotently
