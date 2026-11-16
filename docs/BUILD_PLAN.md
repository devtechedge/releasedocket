# ReleaseDocket build plan

## Product boundary
ReleaseDocket tracks agency-authored delivery batches, links them to source observations, and publishes versioned receipts for client review. GitHub activity is evidence of activity; it does not prove feature correctness or client acceptance.

## Runnable slices
1. Foundation: Next.js, strict TypeScript, PostgreSQL schema/migrations, env validation, security headers, docs and CI.
2. Agency workspace: clients, projects, delivery batches, human acceptance criteria and role-gated writes.
3. Evidence: typed source observations with SHA-specific CI/deployment states, explicit demo data, and manual evidence labelled user-supplied.
4. Receipts: immutable published snapshots, expiring/revocable share tokens, client actions and audit history.
5. Operations: retainer snapshots, billing adapter boundaries, setup and security documentation.

## Current execution

- Done: Next.js/TypeScript foundation, strict CSP nonce for rendered pages, PostgreSQL schema and generated migrations, Better Auth DB sessions, tenant-scoped workspace/client/project/delivery/evidence endpoints and centralized role checks.
- Done: SHA-specific CI/deployment state functions, user-supplied evidence labelling, human-controlled criteria, versioned receipt publication with disclosure/hash/audit, 30-day bearer links, client accept/change action and revoke endpoint.
- Done: synthetic demo dashboard, durable webhook delivery idempotency and outbox enqueue, pricing arithmetic, README and operational/security docs.
- Remaining before production: GitHub App token exchange/repository sync/canonical event reconciliation and worker handlers, OTP and portal rate limiting, Stripe Checkout/Portal/signed lifecycle, email delivery, team invitations, multi-workspace switching, reports/export, workspace deletion/retention, RLS, and PostgreSQL-backed tenancy/action integration tests.

Keep integration and billing status explicit when credentials are absent. Do not claim end-to-end production integrations before configuration and verification.

## Verification
Run lint, typecheck, unit/integration suites and production build where available. Record command outcomes and blocked checks in the final handoff.
