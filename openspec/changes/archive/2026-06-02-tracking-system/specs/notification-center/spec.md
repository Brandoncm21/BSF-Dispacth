## ADDED Requirements

### Requirement: Notification bell SHALL show unread count
The system MUST display the unread notification count on a bell icon and allow the dispatcher to view recent notifications

#### Scenario: Bell badge shows unread count on page load
- **GIVEN** the dispatcher is logged in
- **WHEN** any page loads in the dashboard
- **THEN** the header shows a bell icon with a badge
- **AND** the badge displays the count of unread notifications for that dispatcher

#### Scenario: Dispatcher opens notification dropdown
- **GIVEN** the dispatcher has unread notifications
- **WHEN** they click the bell icon
- **THEN** a dropdown appears showing the 10 most recent notifications
- **AND** each notification shows: icon by type, title, message preview, and relative time (e.g., "hace 5 min")
- **AND** unread notifications are visually distinguished (bold/badge)

#### Scenario: Dispatcher marks notification as read
- **GIVEN** the dispatcher has the notification dropdown open
- **WHEN** they click a notification
- **THEN** the notification is marked as `read`
- **AND** the badge count decrements
- **AND** if the notification is linked to a load, the dispatcher is navigated to that load's detail

#### Scenario: Realtime notification appears as toast without bell click
- **GIVEN** the dispatcher is active on the page
- **WHEN** a new Realtime event arrives
- **THEN** a toast notification appears briefly at the top-right of the screen
- **AND** the bell badge increments without requiring a page refresh

#### Scenario: Dispatcher marks all notifications as read
- **GIVEN** the dispatcher has multiple unread notifications
- **WHEN** they click "Marcar todas como leídas" in the dropdown
- **THEN** all notifications for that dispatcher are marked as `read`
- **AND** the badge count resets to zero

## MODIFIED Requirements

<!-- No existing specs to modify -->

## REMOVED Requirements

<!-- No removed requirements -->
