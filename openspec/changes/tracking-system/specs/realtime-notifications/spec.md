## ADDED Requirements

### Requirement: Realtime broadcast of checkpoints to assigned dispatcher
Feature: Realtime Notifications
Rule: When a driver submits a checkpoint, the assigned dispatcher receives it instantly

#### Scenario: Dispatcher receives checkpoint broadcast in real-time
- **GIVEN** the dispatcher is on any page in the app
- **WHEN** a driver assigned to one of the dispatcher's loads submits a checkpoint
- **THEN** the system broadcasts the checkpoint via Supabase Realtime channel `load-tracking:<load_id>`
- **AND** the dispatcher's client receives the event and triggers a notification toast
- **AND** the toast contains: load number, driver name, checkpoint type, and timestamp

#### Scenario: Multiple dispatchers each receive their own loads only
- **GIVEN** two dispatchers are logged into the app
- **WHEN** a checkpoint is submitted for a load assigned to dispatcher A
- **THEN** only dispatcher A receives the broadcast
- **AND** dispatcher B does not receive it

#### Scenario: Dispatcher receives load status change notification
- **GIVEN** a dispatcher is assigned to a load
- **WHEN** the load status changes automatically due to a driver checkpoint (e.g., `picked_up`, `delivered`)
- **THEN** the dispatcher receives a Realtime broadcast with the new status
- **AND** a notification is persisted to the `notifications` table

#### Scenario: Notifications survive page reload
- **GIVEN** notifications have been sent to a dispatcher
- **WHEN** the dispatcher refreshes the page
- **THEN** all unread notifications are fetched from the `notifications` table
- **AND** the notification badge shows the correct unread count

## MODIFIED Requirements

<!-- No existing specs to modify -->

## REMOVED Requirements

<!-- No removed requirements -->
