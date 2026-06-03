# 0002. Use Supabase Realtime for in-app notifications

- Status: accepted
- Date: 2026-06-02

## Context

The tracking system requires instant delivery of checkpoint events from drivers to dispatchers. Three approaches were considered: Supabase Realtime (built-in WebSocket), a custom WebSocket server, and client-side polling.

Constraints:
- Zero additional infrastructure cost
- Must integrate with existing Supabase setup (SDK already installed)
- Should work alongside existing auth and RLS policies
- No guarantee of message ordering or exactly-once delivery needed (notifications are persisted separately)

## Decision

We will use **Supabase Realtime broadcast channels** for delivering checkpoint and status-change events from server actions to connected browser clients.

The flow is:
1. Server action (`reportCheckpoint`) inserts data and broadcasts to channel `load-tracking:<load_id>`
2. Dispatchers subscribed to their assigned loads' channels receive the event
3. Client displays a toast and updates the notification bell without page refresh
4. Simultaneously, the notification is persisted to the `notifications` table for history

Supabase Realtime uses PostgreSQL logical replication and WebSocket transport. Broadcast channels are fire-and-forget — ideal for this use case where the `notifications` table is the source of truth.

## Consequences

- Positive: No additional infrastructure or cost. Simple API (`supabase.channel().send()`). Works with existing authentication. Auto-reconnects on network interruption.
- Negative: Notifications are not guaranteed-delivery (if client is offline, the broadcast is missed — but the persisted table ensures recovery on reconnect). Broadcast is Supabase-specific (vendor lock-in for this feature).
- Neutral: If future phases need SMS/email, those will use a separate delivery mechanism (Edge Function or external service).
