## 1. Database Migrations

- [ ] 1.1 Create migration: `driver_checkpoints`, `notifications`, `notification_preferences` tables
- [ ] 1.2 ALTER `loads` ADD `tracking_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE`
- [ ] 1.3 CREATE INDEX on `driver_checkpoints(load_id, recorded_at)`
- [ ] 1.4 Enable Supabase Realtime on `driver_checkpoints` for broadcast channel

## 2. Server Actions — Tracking

- [ ] 2.1 Create `lib/actions/tracking.ts` with `reportCheckpoint(loadId, lat, lng, status, notes?)`
- [ ] 2.2 Create `getCheckpointHistory(loadId)` — returns all checkpoints sorted by time
- [ ] 2.3 Create `getLoadTrack(token: string)` — public query for customer portal (load info + last checkpoint)
- [ ] 2.4 Update `createLoad` to auto-generate `tracking_token` on new loads
- [ ] 2.5 Implement Realtime broadcast in `reportCheckpoint` via Supabase channel `load-tracking:<load_id>`

## 3. Server Actions — Notifications

- [ ] 3.1 Create `lib/actions/notifications.ts` with `createNotification(recipientType, recipientId, loadId, type, title, message)`
- [ ] 3.2 Create `getNotifications(dispatcherId)` — returns recent notifications, unread first
- [ ] 3.3 Create `markRead(notificationId)` and `markAllRead(dispatcherId)`
- [ ] 3.4 Integrate notification creation into `reportCheckpoint` for dispatcher alerts

## 4. Frontend — Driver Checkpoint

- [ ] 4.1 Create `components/checkpoint-form.tsx` — form with Browser Geolocation API auto-detect + manual lat/lng override + status dropdown + notes field
- [ ] 4.2 Add checkpoint button to load detail view for drivers
- [ ] 4.3 Integrate Realtime broadcast listener for checkpoint confirmation toast

## 5. Frontend — Notification System

- [ ] 5.1 Create `components/notification-provider.tsx` — React context subscribing to Supabase Realtime channel `notifications:<dispatcherId>`
- [ ] 5.2 Create `components/notification-bell.tsx` — header bell icon with unread badge + dropdown
- [ ] 5.3 Integrate `NotificationProvider` into dashboard layout
- [ ] 5.4 Add toast component for real-time notification delivery

## 6. Frontend — Tracking Map

- [ ] 6.1 Install `mapbox-gl` and `react-map-gl` dependencies + configure Mapbox token
- [ ] 6.2 Create `components/tracking-map.tsx` — Mapbox map with truck markers colored by checkpoint recency (green/amber/red)
- [ ] 6.3 Add marker popup showing unit_number, load_number, last checkpoint time
- [ ] 6.4 Integrate Realtime subscription for live marker position updates
- [ ] 6.5 Integrate `TrackingMap` into `/traceability` page alongside existing fleet alerts

## 7. Frontend — Customer Portal

- [ ] 7.1 Create `app/(public)/layout.tsx` — public layout without sidebar/header
- [ ] 7.2 Create `app/(public)/track/[token]/page.tsx` — public server component that validates token
- [ ] 7.3 Create `components/tracking-page.tsx` — client component with Mapbox mini-map + progress bar + checkpoint timeline
- [ ] 7.4 Add "token inválido" error state for invalid UUIDs

## 8. Validation & Archive

- [ ] 8.1 Run `openspec validate tracking-system --type change --strict`
- [ ] 8.2 Verify all Realtime subscriptions work end-to-end
- [ ] 8.3 Test public tracking page with valid and invalid tokens
- [ ] 8.4 Run full build `npm run build`
- [ ] 8.5 Archive change via `openspec archive tracking-system`
