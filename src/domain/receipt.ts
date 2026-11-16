import { createHash } from "node:crypto";

export type ReceiptState =
  | "draft"
  | "published"
  | "accepted"
  | "changes_requested"
  | "superseded"
  | "revoked";
export interface ReceiptSnapshot {
  title: string;
  summary: string;
  criteria: string[];
  evidenceIds: string[];
  disclosedGaps: string[];
  version: number;
}

function canonical(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export function snapshotHash(snapshot: unknown): string {
  return createHash("sha256").update(canonical(snapshot)).digest("hex");
}

export function canPublish(snapshot: ReceiptSnapshot): {
  allowed: boolean;
  gaps: string[];
} {
  const gaps = [...snapshot.disclosedGaps];
  if (!snapshot.criteria.length) gaps.push("No acceptance criteria recorded");
  if (!snapshot.evidenceIds.length) gaps.push("No evidence attached");
  return { allowed: true, gaps };
}
