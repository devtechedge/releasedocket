import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { outboxJobs } from "@/db/schema";

export type OutboxHandler = (payload: unknown) => Promise<void>;
export type OutboxHandlers = Record<string, OutboxHandler>;

export function retryDelayMs(attempt: number): number {
  return Math.min(60_000 * 2 ** Math.max(0, attempt - 1), 6 * 60 * 60 * 1000);
}

export async function processOutboxBatch(
  handlers: OutboxHandlers,
  limit = 10,
): Promise<{ processed: number; retrying: number }> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const db = getDb();
  const now = new Date();
  const jobs = await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(outboxJobs)
      .where(
        and(
          inArray(outboxJobs.state, ["queued", "processing"]),
          lte(outboxJobs.availableAt, now),
        ),
      )
      .orderBy(asc(outboxJobs.availableAt))
      .limit(safeLimit)
      .for("update", { skipLocked: true });
    for (const job of rows)
      await tx
        .update(outboxJobs)
        .set({
          state: "processing",
          attempts: job.attempts + 1,
          availableAt: new Date(now.getTime() + 5 * 60_000),
        })
        .where(eq(outboxJobs.id, job.id));
    return rows;
  });
  let processed = 0;
  let retrying = 0;
  for (const job of jobs) {
    try {
      const handler = handlers[job.kind];
      if (!handler) throw new Error("handler_unavailable");
      await handler(job.payload);
      await db
        .update(outboxJobs)
        .set({ state: "completed", completedAt: new Date(), lastError: null })
        .where(eq(outboxJobs.id, job.id));
      processed++;
    } catch {
      const attempt = job.attempts + 1;
      await db
        .update(outboxJobs)
        .set({
          state: "queued",
          availableAt: new Date(Date.now() + retryDelayMs(attempt)),
          lastError: "handler_failed",
        })
        .where(eq(outboxJobs.id, job.id));
      retrying++;
    }
  }
  return { processed, retrying };
}
