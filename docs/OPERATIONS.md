# Operations

## Local development

1. Use Node.js 22 or newer and PostgreSQL 15 or newer.
2. Copy `.env.example` to `.env.local`; set `DEMO_MODE=true` for the labelled synthetic dashboard.
3. Set `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to use auth and API routes.
4. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, then `npm run dev`.

## Production

Set `NODE_ENV=production`, a managed PostgreSQL URL, unique auth secret and the production auth URL. Demo mode is forcibly disabled. Apply migrations as a release step. Configure `/api/webhooks/github` only after creating an appropriately read-only GitHub App. Stripe, mail and AI credentials are optional until their adapters are implemented; absent integrations must remain labelled disconnected.

## Recovery

Back up PostgreSQL and test restore before upgrades. Apply additive migrations first and deploy code second. Webhook delivery rows are idempotency records; since processing is not implemented, replay/reconciliation is an operational follow-up. Do not delete audit or receipt history by hand.
