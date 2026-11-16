import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { memberships } from "@/db/schema";
import type { WorkspaceRole } from "@/services/authorization";

export async function membershipRole(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const [membership] = await getDb()
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return membership?.role ?? null;
}
