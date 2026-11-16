import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { auditEvents, criteria, evidenceLinks, memberships } from "@/db/schema";
import { requireCapability } from "@/services/authorization";

export async function POST(
  request: Request,
  context: { params: Promise<{ criterionId: string }> },
) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const { criterionId } = await context.params;
  const body = z
    .object({
      workspaceId: z.uuid(),
      state: z.enum([
        "not_started",
        "in_progress",
        "met",
        "not_met",
        "deferred",
      ]),
    })
    .safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(criterionId).success || !body.success)
    return Response.json(
      { error: "Invalid criterion update." },
      { status: 400 },
    );
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
    return Response.json({ error: "Criterion not found." }, { status: 404 });
  try {
    requireCapability(member.role, "delivery:write");
  } catch {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  const [criterion] = await db
    .select({ id: criteria.id, statement: criteria.statement })
    .from(criteria)
    .where(
      and(
        eq(criteria.id, criterionId),
        eq(criteria.workspaceId, body.data.workspaceId),
      ),
    )
    .limit(1);
  if (!criterion)
    return Response.json({ error: "Criterion not found." }, { status: 404 });
  if (body.data.state === "met") {
    const [mapped] = await db
      .select({ id: evidenceLinks.id })
      .from(evidenceLinks)
      .where(
        and(
          eq(evidenceLinks.criterionId, criterion.id),
          eq(evidenceLinks.workspaceId, body.data.workspaceId),
        ),
      )
      .limit(1);
    if (!mapped)
      return Response.json(
        {
          error:
            "Map at least one evidence observation before marking this criterion met.",
        },
        { status: 409 },
      );
  }
  await db.transaction(async (tx) => {
    await tx
      .update(criteria)
      .set({ state: body.data.state })
      .where(
        and(
          eq(criteria.id, criterion.id),
          eq(criteria.workspaceId, body.data.workspaceId),
        ),
      );
    await tx
      .insert(auditEvents)
      .values({
        id: randomUUID(),
        workspaceId: body.data.workspaceId,
        actorId: session.user.id,
        action: "criterion.state_changed",
        targetId: criterion.id,
        metadata: { state: body.data.state },
      });
  });
  return Response.json({ id: criterion.id, state: body.data.state });
}
