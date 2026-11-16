# Testing

## Local checks

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run e2e
npm run build
```

The Vitest suite covers SHA-bound check/deployment state, receipt disclosure and hashing, role boundaries, retry timing and GitHub HMAC verification. Playwright checks demo search and draft creation and runs axe against the dashboard. CI installs Chromium and runs the same checks.

## Database checks

`npm run db:generate` validates the Drizzle schema and produces migration SQL. `npm run db:migrate` requires a configured `DATABASE_URL`. PostgreSQL-backed route isolation, webhook transaction/idempotency and portal expiry/revocation tests are still needed; the current suite does not claim those database integration cases passed.

## Production smoke

With production build output and `npm start`, verify that the HTML response has a per-request CSP nonce, nonce-bearing Next scripts, security headers and no demo records even when `DEMO_MODE=true`. The app must receive a PostgreSQL URL and Better Auth secret before signup or authenticated APIs can work.
