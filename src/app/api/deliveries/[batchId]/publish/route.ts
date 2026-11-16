import { createHash, randomBytes, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, desc, eq, inArray } from "drizzle-orm";
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
  receiptVersions,
  portalTokens,
} from "@/db/schema";
import { requireCapability } from "@/services/authorization";
import { snapshotHash } from "@/domain/receipt";

export async function POST(
  request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const { batchId } = await context.params;
  if (!z.uuid().safeParse(batchId).success)
    return Response.json({ error: "Delivery not found." }, { status: 404 });
  const body = z
    .object({ workspaceId: z.uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json({ error: "Workspace is required." }, { status: 400 });
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
    return Response.json({ error: "Delivery not found." }, { status: 404 });
  try {
    requireCapability(member.role, "receipt:publish");
  } catch {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  const [batch] = await db
    .select()
    .from(deliveryBatches)
    .where(
      and(
        eq(deliveryBatches.id, batchId),
        eq(deliveryBatches.workspaceId, body.data.workspaceId),
      ),
    )
    .limit(1);
  if (!batch)
    return Response.json({ error: "Delivery not found." }, { status: 404 });
  const criterionRows = await db
    .select()
    .from(criteria)
    .where(
      and(
        eq(criteria.batchId, batch.id),
        eq(criteria.workspaceId, body.data.workspaceId),
      ),
    )
    .limit(100);
  criterionRows.sort((a, b) => a.id.localeCompare(b.id));
  const links = await db
    .select({
      observationId: evidenceLinks.observationId,
      criterionId: evidenceLinks.criterionId,
    })
    .from(evidenceLinks)
    .where(
      and(
        eq(evidenceLinks.batchId, batch.id),
        eq(evidenceLinks.workspaceId, body.data.workspaceId),
      ),
    )
    .limit(500);
  const observationIds = [...new Set(links.map((link) => link.observationId))];
  const evidence = observationIds.length
    ? await db
        .select()
        .from(observations)
        .where(
          and(
            eq(observations.workspaceId, body.data.workspaceId),
            inArray(observations.id, observationIds),
          ),
        )
        .limit(500)
    : [];
  evidence.sort((a, b) => a.id.localeCompare(b.id));
  const gaps = criterionRows.flatMap((item) => [
    ...(!links.some((link) => link.criterionId === item.id)
      ? [`No evidence mapped to: ${item.statement}`]
      : []),
    ...(item.state !== "met"
      ? [
          `Acceptance criterion not marked met: ${item.statement} (${item.state})`,
        ]
      : []),
  ]);
  if (!criterionRows.length)
    gaps.push("No human-written acceptance criteria are recorded.");
  if (!evidence.length) gaps.push("No evidence observations are attached.");
  if (evidence.some((item) => item.source === "user_supplied"))
    gaps.push(
      "User-supplied links are recorded as claims and have not been independently verified.",
    );
  const versionId = randomUUID();
  const [previous] = await db
    .select({ version: receiptVersions.version })
    .from(receiptVersions)
    .where(
      and(
        eq(receiptVersions.batchId, batch.id),
        eq(receiptVersions.workspaceId, body.data.workspaceId),
      ),
    )
    .orderBy(desc(receiptVersions.version))
    .limit(1);
  const version = (previous?.version ?? 0) + 1;
  const snapshot = {
    title: batch.title,
    summary: batch.summary,
    targetDate: batch.targetDate,
    criteria: criterionRows,
    evidence,
    disclosures: gaps,
    version,
    publishedBy: session.user.name,
    publishedAt: new Date().toISOString(),
  };
  const digest = snapshotHash(snapshot);
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.transaction(async (tx) => {
    if (previous)
      await tx
        .update(receiptVersions)
        .set({ state: "superseded" })
        .where(
          and(
            eq(receiptVersions.batchId, batch.id),
            eq(receiptVersions.workspaceId, body.data.workspaceId),
            eq(receiptVersions.version, previous.version),
          ),
        );
    await tx
      .insert(receiptVersions)
      .values({
        id: versionId,
        workspaceId: body.data.workspaceId,
        batchId: batch.id,
        version,
        state: "published",
        snapshot,
        sha256: digest,
        publishedAt: new Date(),
        createdBy: session.user.id,
      });
    await tx
      .insert(portalTokens)
      .values({
        id: randomUUID(),
        workspaceId: body.data.workspaceId,
        receiptVersionId: versionId,
        tokenHash,
        expiresAt,
      });
    await tx
      .insert(auditEvents)
      .values({
        id: randomUUID(),
        workspaceId: body.data.workspaceId,
        actorId: session.user.id,
        action: "receipt.published",
        targetId: versionId,
        metadata: {
          batchId,
          version,
          disclosedGapCount: gaps.length,
          sha256: digest,
        },
      });
  });
  return Response.json(
    {
      version,
      state: "published",
      sha256: digest,
      disclosures: gaps,
      sharePath: `/portal/${rawToken}`,
      expiresAt,
    },
    { status: 201 },
  );
}
