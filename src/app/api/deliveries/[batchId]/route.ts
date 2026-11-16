import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import {
  criteria,
  deliveryBatches,
  evidenceLinks,
  memberships,
  observations,
} from "@/db/schema";

export async function GET(
  request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const { batchId } = await context.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (
    !z.uuid().safeParse(batchId).success ||
    !workspaceId ||
    !z.uuid().safeParse(workspaceId).success
  )
    return Response.json({ error: "Delivery not found." }, { status: 404 });
  const db = getDb();
  const [member] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!member)
    return Response.json({ error: "Delivery not found." }, { status: 404 });
  if (member.role === "CLIENT_VIEWER")
    return Response.json({ error: "Forbidden." }, { status: 403 });
  const [delivery] = await db
    .select()
    .from(deliveryBatches)
    .where(
      and(
        eq(deliveryBatches.id, batchId),
        eq(deliveryBatches.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!delivery)
    return Response.json({ error: "Delivery not found." }, { status: 404 });
  const criterionRows = await db
    .select()
    .from(criteria)
    .where(
      and(eq(criteria.batchId, batchId), eq(criteria.workspaceId, workspaceId)),
    )
    .limit(100);
  const links = await db
    .select({
      observationId: evidenceLinks.observationId,
      criterionId: evidenceLinks.criterionId,
    })
    .from(evidenceLinks)
    .where(
      and(
        eq(evidenceLinks.batchId, batchId),
        eq(evidenceLinks.workspaceId, workspaceId),
      ),
    )
    .limit(500);
  const ids = [...new Set(links.map((link) => link.observationId))];
  const evidence = ids.length
    ? await db
        .select()
        .from(observations)
        .where(
          and(
            eq(observations.workspaceId, workspaceId),
            inArray(observations.id, ids),
          ),
        )
        .limit(500)
    : [];
  return Response.json({
    delivery,
    criteria: criterionRows.map((item) => ({
      ...item,
      evidenceCount: links.filter((link) => link.criterionId === item.id)
        .length,
    })),
    evidence,
  });
}
