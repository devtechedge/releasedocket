import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { clients, memberships } from "@/db/schema";
import { requireCapability } from "@/services/authorization";

const clientInput = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.email().optional(),
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
  const result = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(eq(clients.workspaceId, workspaceId))
    .limit(100);
  return Response.json({ clients: result });
}
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const parsed = clientInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      {
        error: "Invalid client details.",
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
    requireCapability(member.role, "client:write");
  } catch {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }
  const [created] = await db
    .insert(clients)
    .values({ id: randomUUID(), ...parsed.data })
    .returning({ id: clients.id, name: clients.name, email: clients.email });
  return Response.json({ client: created }, { status: 201 });
}
