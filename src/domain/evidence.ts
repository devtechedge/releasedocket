export type EvidenceState =
  "pending" | "verified" | "stale" | "failed" | "unknown" | "not_applicable";
export type EvidenceKind =
  | "pull_request"
  | "check_run"
  | "deployment"
  | "release"
  | "manual"
  | "agency_statement"
  | "client_supplied";

export interface EvidenceObservation {
  id: string;
  kind: EvidenceKind;
  state: EvidenceState;
  title: string;
  url?: string;
  repository?: string;
  sha?: string;
  observedAt: string;
  source: "github" | "user_supplied" | "agency" | "client";
}

export function checkStateForSha(
  observationSha: string | undefined,
  currentSha: string | undefined,
  conclusion?: string,
): EvidenceState {
  if (!observationSha || !currentSha) return "unknown";
  if (observationSha !== currentSha) return "stale";
  if (conclusion === "success") return "verified";
  if (
    conclusion === "failure" ||
    conclusion === "cancelled" ||
    conclusion === "timed_out"
  )
    return "failed";
  return "pending";
}

export function deploymentStateForSha(
  deployedSha: string | undefined,
  expectedSha: string | undefined,
): EvidenceState {
  if (!deployedSha || !expectedSha) return "unknown";
  return deployedSha === expectedSha ? "verified" : "stale";
}
