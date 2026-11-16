# Decisions

- Use a TypeScript modular monolith with Next.js App Router, PostgreSQL, Drizzle and Zod.
- Keep tenant scope in service/repository boundaries; every tenant-owned record carries workspace ownership or a tenant-owned parent.
- Explicit demo mode is isolated and visibly labelled. It must be disabled in production.
- GitHub App evidence is read-only metadata. No personal access tokens or source-code ingestion.
- Evidence state is separate from delivery criteria and client acceptance. A CI result is valid only for its exact commit SHA; a deployment without a SHA is unknown.
- Publishing creates a versioned snapshot. Updates create new versions; client actions name a specific version and are audited.
- A hash detects accidental snapshot changes; it does not provide blockchain immutability.
- Stripe entitlements activate only after a verified webhook. Missing credentials means billing is disconnected.
- Integrations use server-side adapters so provider details do not enter UI or domain rules.
