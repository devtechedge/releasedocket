import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { memberships, workspaces } from "@/db/schema";

const createWorkspace = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const db = getDb();
  const result = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
    .where(
      and(
        eq(memberships.userId, session.user.id),
        ne(memberships.role, "CLIENT_VIEWER"),
      ),
    )
    .limit(100);
  return Response.json({ workspaces: result });
}

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthenticated." }, { status: 401 });
  const parsed = createWorkspace.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      {
        error: "Invalid workspace details.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const id = randomUUID();
  try {
    await getDb().transaction(async (tx) => {
      await tx.insert(workspaces).values({ id, ...parsed.data });
      await tx
        .insert(memberships)
        .values({
          id: randomUUID(),
          workspaceId: id,
          userId: session.user.id,
          role: "OWNER",
        });
    });
    return Response.json({ id, ...parsed.data }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Workspace name is unavailable or could not be saved." },
      { status: 409 },
    );
  }
}
