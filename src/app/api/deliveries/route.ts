import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import {
  clients,
  criteria,
  deliveryBatches,
  memberships,
  projects,
} from "@/db/schema";
import { requireCapability } from "@/services/authorization";

const input = z.object({
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().max(3000).default(""),
  targetDate: z.iso.datetime().optional(),
  criteria: z
    .array(
      z.object({
        category: z.string().trim().min(2).max(40),
        priority: z.enum(["low", "normal", "high"]),
        statement: z.string().trim().min(5).max(1000),
      }),
    )
    .max(50)
    .default([]),
});

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (!workspaceId || !z.uuid().safeParse(workspaceId).success)
    return Response.json({ error: "Workspace is required." }, { status: 400 });
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
    return Response.json({ error: "Workspace not found." }, { status: 404 });
  if (member.role === "CLIENT_VIEWER")
    return Response.json({ error: "Forbidden." }, { status: 403 });
  const batches = await db
    .select()
    .from(deliveryBatches)
    .where(eq(deliveryBatches.workspaceId, workspaceId))
    .orderBy(desc(deliveryBatches.createdAt))
    .limit(100);
  return Response.json({ deliveries: batches });
}

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      {
        error: "Invalid delivery details.",
        fields: parsed.error.flatten().fieldErrors,
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
    requireCapability(member.role, "delivery:write");
  } catch {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .where(
      and(
        eq(projects.id, parsed.data.projectId),
        eq(projects.workspaceId, parsed.data.workspaceId),
        eq(clients.workspaceId, parsed.data.workspaceId),
      ),
    )
    .limit(1);
  if (!project)
    return Response.json({ error: "Project not found." }, { status: 404 });
  const batchId = randomUUID();
  await db.transaction(async (tx) => {
    await tx
      .insert(deliveryBatches)
      .values({
        id: batchId,
        workspaceId: parsed.data.workspaceId,
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        summary: parsed.data.summary,
        targetDate: parsed.data.targetDate
          ? new Date(parsed.data.targetDate)
          : null,
        createdBy: session.user.id,
      });
    if (parsed.data.criteria.length)
      await tx
        .insert(criteria)
        .values(
          parsed.data.criteria.map((item) => ({
            id: randomUUID(),
            workspaceId: parsed.data.workspaceId,
            batchId,
            ...item,
          })),
        );
  });
  return Response.json({ id: batchId, state: "draft" }, { status: 201 });
}
