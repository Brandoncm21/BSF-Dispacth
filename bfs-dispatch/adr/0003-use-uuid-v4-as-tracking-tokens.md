# 0003. Use UUID v4 as public tracking tokens

- Status: accepted
- Date: 2026-06-02

## Context

The customer portal (`/track/[token]`) needs a way to identify loads without requiring authentication. Brokers and shippers must be able to view load progress via a URL without login credentials.

Options considered: UUID v4, JWT tokens, numeric PIN codes, short alphanumeric slugs.

Constraints:
- Tokens must be unguessable (security by obscurity is the only protection)
- Tokens must be simple to generate and store
- No sensitive data should be accessible via the token
- Should support token regeneration if leaked

## Decision

Each load will be assigned a **UUID v4** token at creation time via PostgreSQL's `gen_random_uuid()` function, stored in a new `loads.tracking_token` column with a UNIQUE index.

UUID v4 is:
- 128 bits of randomness — effectively unguessable (1 in 2^122 chance of collision)
- Standard format — no custom encoding needed
- Generated server-side by PostgreSQL — no client involvement
- Index-friendly with default B-tree index

The tracking page (`/track/[uuid]`) is rendered by a public server component that queries `loads.tracking_token` to retrieve only non-sensitive data: load number, status, origin/destination, driver name, and checkpoints.

## Consequences

- Positive: Simple, secure, no additional infrastructure. Human-readable URLs (`/track/a1b2c3d4-...`). Easy to regenerate with `UPDATE loads SET tracking_token = gen_random_uuid()`. No custom crypto or signing implementation needed.
- Negative: URLs are long (36 characters + dashes). Not human-memorable. Tokens are visible in the URL — users could theoretically share them (this is by design for customer portal, but an intentional trade-off).
- Neutral: If a more sophisticated access control is needed later (e.g., per-shipper authentication), the token system can supplement it without breaking existing URLs.
