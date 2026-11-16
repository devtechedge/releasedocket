# Billing

Pricing hypotheses are Solo $99, Studio $249, Agency $499 and Partner $999 per month. Entitlements are centralized in `src/domain/entitlements.ts`. The illustrative arithmetic is 21 Agency accounts × $499 = $10,479 MRR before churn, discounts, tax and fees; this is not a forecast or customer claim.

Stripe is not connected yet. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are placeholders; no checkout, customer portal, webhook verification or subscription persistence is implemented. Billing remains disconnected until a verified lifecycle integration exists. Never activate an entitlement from a browser request.
