import { describe, expect, it } from "vitest";
import { checkStateForSha, deploymentStateForSha } from "@/domain/evidence";
import { canPublish, snapshotHash } from "@/domain/receipt";
import { can } from "@/services/authorization";
import { retryDelayMs } from "@/jobs/outbox";

describe("evidence and receipt rules", () => {
  it("only verifies checks for the exact tested SHA", () => {
    expect(checkStateForSha("abc", "abc", "success")).toBe("verified");
    expect(checkStateForSha("abc", "def", "success")).toBe("stale");
    expect(checkStateForSha(undefined, "abc", "success")).toBe("unknown");
    expect(checkStateForSha("abc", "abc", "failure")).toBe("failed");
  });
  it("keeps deployments with missing SHAs unknown", () => {
    expect(deploymentStateForSha(undefined, "abc")).toBe("unknown");
    expect(deploymentStateForSha("abc", "abc")).toBe("verified");
    expect(deploymentStateForSha("def", "abc")).toBe("stale");
  });
  it("allows publishing only with conspicuous gaps and hashes a stable snapshot", () => {
    const snapshot = {
      title: "Release",
      summary: "",
      criteria: [],
      evidenceIds: [],
      disclosedGaps: [],
      version: 1,
    };
    expect(canPublish(snapshot)).toEqual({
      allowed: true,
      gaps: ["No acceptance criteria recorded", "No evidence attached"],
    });
    expect(snapshotHash(snapshot)).toHaveLength(64);
  });
  it("keeps client roles away from agency operations", () => {
    expect(can("CLIENT_VIEWER", "client:respond")).toBe(true);
    expect(can("CLIENT_VIEWER", "workspace:manage")).toBe(false);
  });
  it("hashes snapshots independent of object key order and bounds job retries", () => {
    expect(snapshotHash({ b: 2, a: 1 })).toBe(snapshotHash({ a: 1, b: 2 }));
    expect(snapshotHash({ at: new Date("2026-11-17T00:00:00.000Z") })).toBe(
      snapshotHash({ at: "2026-11-17T00:00:00.000Z" }),
    );
    expect(retryDelayMs(1)).toBe(60_000);
    expect(retryDelayMs(10)).toBe(6 * 60 * 60 * 1000);
  });
});
