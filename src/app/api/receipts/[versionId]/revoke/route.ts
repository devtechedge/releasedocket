import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import {
  auditEvents,
  memberships,
  portalTokens,
  receiptVersions,
} from "@/db/schema";
import { requireCapability } from "@/services/authorization";

export async function POST(
  request: Request,
  context: { params: Promise<{ versionId: string }> },
) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const { versionId } = await context.params;
  const body = z
    .object({ workspaceId: z.uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(versionId).success || !body.success)
    return Response.json({ error: "Receipt not found." }, { status: 404 });
  const db = getDb();
  const [member] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.workspaceId, body.data.workspaceId),
      ),
    )
    .limit(1);
  if (!member)
    return Response.json({ error: "Receipt not found." }, { status: 404 });
  try {
    requireCapability(member.role, "receipt:publish");
  } catch {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  const [receipt] = await db
    .select({ id: receiptVersions.id, state: receiptVersions.state })
    .from(receiptVersions)
    .where(
      and(
        eq(receiptVersions.id, versionId),
        eq(receiptVersions.workspaceId, body.data.workspaceId),
      ),
    )
    .limit(1);
  if (!receipt || receipt.state === "revoked")
    return Response.json({ error: "Receipt not found." }, { status: 404 });
  await db.transaction(async (tx) => {
    await tx
      .update(receiptVersions)
      .set({ state: "revoked" })
      .where(eq(receiptVersions.id, receipt.id));
    await tx
      .update(portalTokens)
      .set({ revokedAt: new Date() })
      .where(eq(portalTokens.receiptVersionId, receipt.id));
    await tx
      .insert(auditEvents)
      .values({
        id: randomUUID(),
        workspaceId: body.data.workspaceId,
        actorId: session.user.id,
        action: "receipt.revoked",
        targetId: receipt.id,
        metadata: {},
      });
  });
  return Response.json({ state: "revoked" });
}
