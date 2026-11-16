export function billingState(
  configured: boolean,
): "connected" | "disconnected" {
  return configured ? "connected" : "disconnected";
}

// Plan changes are intentionally applied only after a verified Stripe webhook.
export function activatePlanFromWebhook(signatureVerified: boolean): boolean {
  return signatureVerified;
}
