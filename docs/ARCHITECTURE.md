# Architecture

ReleaseDocket is a Next.js modular monolith. Routes authenticate requests, validate input with Zod and delegate access decisions to services. Drizzle repositories use PostgreSQL and include `workspace_id` in tenant-owned rows. Client/project creation verifies both membership and parent ownership.

Better Auth stores users, credential accounts and sessions in PostgreSQL. GitHub App installation is a separate integration. The webhook endpoint verifies the raw body with HMAC SHA-256 and constant-time comparison, records delivery IDs idempotently, and atomically adds signed event metadata to the database outbox. Event reconciliation and canonical GitHub fetches are not implemented.

Evidence observations are separate from acceptance criteria and receipt decisions. CI and deployment states are computed against exact SHAs. Criteria can be marked met only after evidence is mapped, and only by an authorized human. Publishing creates a SHA-256 hashed version, 30-day hashed bearer link, disclosure list, and audit event in one transaction. The public portal is version-specific and supports acceptance, change requests, expiry and staff revocation. The digest detects changes; it is not a tamper-proof external ledger. OTP email verification and portal rate limiting remain unimplemented.

Demo data exists only in development when `DEMO_MODE=true`; production mode always disables it. Production includes email/password signup and sign-in, workspace creation, client/project setup, delivery creation, evidence mapping, criterion status, publishing and client portal actions. Team/invitation management, multi-workspace switching, GitHub sync, billing, reports and audit UI remain incomplete. Core DB services require `DATABASE_URL` and auth secrets.
