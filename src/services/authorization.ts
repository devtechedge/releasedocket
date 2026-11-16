export type WorkspaceRole =
  "OWNER" | "ADMIN" | "DELIVERY_LEAD" | "CONTRIBUTOR" | "CLIENT_VIEWER";
export type Capability =
  | "workspace:manage"
  | "client:write"
  | "delivery:write"
  | "receipt:publish"
  | "evidence:map"
  | "client:respond";

const grants: Record<WorkspaceRole, ReadonlySet<Capability>> = {
  OWNER: new Set([
    "workspace:manage",
    "client:write",
    "delivery:write",
    "receipt:publish",
    "evidence:map",
    "client:respond",
  ]),
  ADMIN: new Set([
    "workspace:manage",
    "client:write",
    "delivery:write",
    "receipt:publish",
    "evidence:map",
    "client:respond",
  ]),
  DELIVERY_LEAD: new Set([
    "client:write",
    "delivery:write",
    "receipt:publish",
    "evidence:map",
    "client:respond",
  ]),
  CONTRIBUTOR: new Set(["delivery:write", "evidence:map"]),
  CLIENT_VIEWER: new Set(["client:respond"]),
};

export function can(role: WorkspaceRole, capability: Capability): boolean {
  return grants[role].has(capability);
}
export function requireCapability(
  role: WorkspaceRole,
  capability: Capability,
): void {
  if (!can(role, capability)) throw new Error("FORBIDDEN");
}
