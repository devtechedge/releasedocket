# ReleaseDocket

ReleaseDocket links agency delivery claims to evidence and client decisions. It treats GitHub activity as observations: a merged pull request proves a merge, an exact-SHA check proves that check result, and neither proves a feature works for a client.

## Current state

This repository contains the runnable foundation: a responsive synthetic dashboard, Better Auth email/password and database session configuration, PostgreSQL/Drizzle schema and migrations, tenant-scoped workspace/client/project/delivery/evidence APIs, role checks, human-controlled criterion status, versioned receipt publishing and client responses, and signed idempotent GitHub webhook intake with outbox storage.

The synthetic dashboard is development-only and visibly labelled. Production mode renders the authenticated signup/workspace and delivery console, never sample records. The GitHub webhook queues signed event metadata but does not reconcile events, fetch canonical state or sync repositories. Portal links are bearer links without OTP and need rate limiting before broad deployment. Stripe lifecycle, email jobs, outbox handlers, RLS, invitations, multi-workspace switching and reports are not implemented. No AI provider is configured. Do not treat this foundation as production-ready until these flows and checks are completed.

## Local setup

Requirements: Node.js 22+, PostgreSQL 15+.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

To use API routes, set `DATABASE_URL`, a random `BETTER_AUTH_SECRET` (32+ characters) and `BETTER_AUTH_URL=http://localhost:3000` in `.env.local`; then run:

```powershell
npm run db:generate
npm run db:migrate
```

Keep `DEMO_MODE=true` for the visibly synthetic dashboard in development. It is forcibly disabled in production. Never put real credentials in demo fixtures.

## Commands

`npm run dev` starts Next.js. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` run project checks. `npm run db:generate` creates migrations; `npm run db:migrate` applies them.

## Deployment

Deploy the Next.js app with a managed PostgreSQL database (for example Vercel + Neon). Apply migrations before serving new code. Configure HTTPS auth URLs and secrets in the hosting secret manager. GitHub App permissions and current webhook limits are described in [`docs/GITHUB_APP.md`](docs/GITHUB_APP.md). Billing and email remain disconnected until their adapters are implemented.

## Product arithmetic

21 hypothetical Agency accounts × $499 = $10,479 MRR before churn, discounts, tax and fees. This is arithmetic only, not a forecast or a claim about customers.
