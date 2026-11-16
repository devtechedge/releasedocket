# Security notes

- Use HTTPS and a unique random `BETTER_AUTH_SECRET` of at least 32 characters. Better Auth configures database sessions, HttpOnly cookies and secure cookies in production.
- Rendered pages receive a fresh CSP nonce through the Next.js 16 `proxy.ts`; development adds `unsafe-eval` only for React tooling.
- Keep secrets in a secret manager. Never log webhook bodies, tokens, private keys or database URLs.
- Routes derive the user from the server session and verify workspace membership before tenant reads and writes. Workspace IDs in request bodies are selectors, never authorization.
- GitHub webhook signatures are checked over raw bytes before writes. Delivery IDs are unique for idempotency.
- Store metadata only; never fetch arbitrary evidence URLs or ingest repository contents.
- Receipt hashing detects accidental snapshot changes but is not blockchain immutability.
- Workspace deletion, retention enforcement, RLS, portal OTP/rate limiting and full audit coverage have not yet been implemented.
