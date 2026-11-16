import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  auditEvents,
  clientActions,
  portalTokens,
  receiptVersions,
} from "@/db/schema";

async function readToken(token: string) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [record] = await getDb()
    .select({
      workspaceId: portalTokens.workspaceId,
      expiresAt: portalTokens.expiresAt,
      revokedAt: portalTokens.revokedAt,
      receipt: receiptVersions,
    })
    .from(portalTokens)
    .innerJoin(
      receiptVersions,
      eq(receiptVersions.id, portalTokens.receiptVersionId),
    )
    .where(eq(portalTokens.tokenHash, tokenHash))
    .limit(1);
  if (
    !record ||
    record.revokedAt ||
    record.expiresAt <= new Date() ||
    !["published", "accepted", "changes_requested"].includes(
      record.receipt.state,
    )
  )
    return null;
  return record;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const record = await readToken(token);
  if (!record)
    return Response.json(
      { error: "Receipt link is invalid or expired." },
      { status: 404 },
    );
  return Response.json({
    receipt: record.receipt.snapshot,
    state: record.receipt.state,
    version: record.receipt.version,
    sha256: record.receipt.sha256,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const record = await readToken(token);
  if (!record)
    return Response.json(
      { error: "Receipt link is invalid or expired." },
      { status: 404 },
    );
  if (record.receipt.state !== "published")
    return Response.json(
      { error: "This receipt version is no longer accepting responses." },
      { status: 409 },
    );
  const body = z
    .object({
      action: z.enum(["accept", "request_changes"]),
      comment: z.string().trim().max(2000).default(""),
    })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json({ error: "Invalid client action." }, { status: 400 });
  if (body.data.action === "request_changes" && body.data.comment.length < 3)
    return Response.json(
      { error: "Add a short note describing the requested changes." },
      { status: 400 },
    );
  const state =
    body.data.action === "accept" ? "accepted" : "changes_requested";
  await getDb().transaction(async (tx) => {
    await tx
      .update(receiptVersions)
      .set({ state })
      .where(eq(receiptVersions.id, record.receipt.id));
    await tx
      .insert(clientActions)
      .values({
        id: randomUUID(),
        workspaceId: record.workspaceId,
        receiptVersionId: record.receipt.id,
        action: body.data.action,
        comment: body.data.comment || null,
      });
    await tx
      .insert(auditEvents)
      .values({
        id: randomUUID(),
        workspaceId: record.workspaceId,
        actorId: null,
        action: `client.${body.data.action}`,
        targetId: record.receipt.id,
        metadata: { version: record.receipt.version },
      });
  });
  return Response.json({ state, version: record.receipt.version });
}
