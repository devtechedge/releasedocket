import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import {
  auditEvents,
  criteria,
  deliveryBatches,
  evidenceLinks,
  memberships,
  observations,
} from "@/db/schema";
import { requireCapability } from "@/services/authorization";

const input = z.object({
  workspaceId: z.uuid(),
  batchId: z.uuid(),
  criterionId: z.uuid().optional(),
  url: z.url().max(2048),
  title: z.string().trim().min(3).max(200),
  note: z.string().trim().max(1000).default(""),
  observedAt: z.iso.datetime(),
});
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      {
        error: "Invalid evidence details.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const url = new URL(parsed.data.url);
  if (url.protocol !== "https:" || url.username || url.password)
    return Response.json(
      {
        error: "Evidence links must use HTTPS and cannot contain credentials.",
      },
      { status: 400 },
    );
  const db = getDb();
  const [member] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.workspaceId, parsed.data.workspaceId),
      ),
    )
    .limit(1);
  if (!member)
    return Response.json({ error: "Workspace not found." }, { status: 404 });
  try {
    requireCapability(member.role, "evidence:map");
  } catch {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  const [batch] = await db
    .select({ id: deliveryBatches.id })
    .from(deliveryBatches)
    .where(
      and(
        eq(deliveryBatches.id, parsed.data.batchId),
        eq(deliveryBatches.workspaceId, parsed.data.workspaceId),
      ),
    )
    .limit(1);
  if (!batch)
    return Response.json({ error: "Delivery not found." }, { status: 404 });
  if (parsed.data.criterionId) {
    const [criterion] = await db
      .select({ id: criteria.id })
      .from(criteria)
      .where(
        and(
          eq(criteria.id, parsed.data.criterionId),
          eq(criteria.batchId, batch.id),
          eq(criteria.workspaceId, parsed.data.workspaceId),
        ),
      )
      .limit(1);
    if (!criterion)
      return Response.json(
        { error: "Acceptance criterion not found." },
        { status: 404 },
      );
  }
  const observationId = randomUUID();
  await db.transaction(async (tx) => {
    await tx
      .insert(observations)
      .values({
        id: observationId,
        workspaceId: parsed.data.workspaceId,
        kind: "manual",
        source: "user_supplied",
        url: parsed.data.url,
        title: parsed.data.title,
        state: "unknown",
        observedAt: new Date(parsed.data.observedAt),
        metadata: { note: parsed.data.note },
      });
    await tx
      .insert(evidenceLinks)
      .values({
        id: randomUUID(),
        workspaceId: parsed.data.workspaceId,
        observationId,
        batchId: batch.id,
        criterionId: parsed.data.criterionId ?? null,
      });
    await tx
      .insert(auditEvents)
      .values({
        id: randomUUID(),
        workspaceId: parsed.data.workspaceId,
        actorId: session.user.id,
        action: "evidence.attached",
        targetId: observationId,
        metadata: {
          batchId: batch.id,
          criterionId: parsed.data.criterionId ?? null,
          source: "user_supplied",
        },
      });
  });
  return Response.json(
    { id: observationId, state: "unknown", source: "user_supplied" },
    { status: 201 },
  );
}
