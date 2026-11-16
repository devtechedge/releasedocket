import { randomUUID } from "node:crypto";
import { getDb } from "@/db";
import { outboxJobs, webhookDeliveries } from "@/db/schema";
import { verifyGithubSignature } from "@/integrations/github/signature";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret)
    return Response.json(
      { error: "GitHub webhook is not configured." },
      { status: 503 },
    );
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (rawBody.byteLength > 1_000_000)
    return Response.json({ error: "Payload too large." }, { status: 413 });
  if (
    !verifyGithubSignature(
      rawBody,
      request.headers.get("x-hub-signature-256"),
      secret,
    )
  ) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }
  const deliveryId = request.headers.get("x-github-delivery");
  const event = request.headers.get("x-github-event");
  if (!deliveryId || !event || !/^[0-9a-f-]{20,64}$/i.test(deliveryId))
    return Response.json(
      { error: "Missing delivery metadata." },
      { status: 400 },
    );
  const allowedEvents = new Set([
    "installation",
    "installation_repositories",
    "pull_request",
    "pull_request_review",
    "check_run",
    "workflow_run",
    "deployment",
    "deployment_status",
    "release",
  ]);
  if (!allowedEvents.has(event))
    return Response.json({ error: "Unsupported event type." }, { status: 400 });
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as unknown;
  } catch {
    return Response.json({ error: "Invalid event payload." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return Response.json({ error: "Invalid event payload." }, { status: 400 });
  try {
    const db = getDb();
    let duplicate = false;
    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(webhookDeliveries)
        .values({
          id: randomUUID(),
          provider: "github",
          deliveryId,
          state: "received",
        })
        .onConflictDoNothing()
        .returning({ id: webhookDeliveries.id });
      duplicate = inserted.length === 0;
      if (!duplicate)
        await tx
          .insert(outboxJobs)
          .values({
            id: randomUUID(),
            kind: `github.${event}`,
            payload: { deliveryId, event, payload },
            state: "queued",
          });
    });
    return Response.json(
      {
        accepted: true,
        duplicate,
        event,
        state: duplicate ? "duplicate" : "queued",
      },
      { status: 202 },
    );
  } catch {
    return Response.json(
      { error: "Webhook could not be durably recorded." },
      { status: 503 },
    );
  }
}
