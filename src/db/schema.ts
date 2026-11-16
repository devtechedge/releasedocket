import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("member_role", [
  "OWNER",
  "ADMIN",
  "DELIVERY_LEAD",
  "CONTRIBUTOR",
  "CLIENT_VIEWER",
]);
export const evidenceStateEnum = pgEnum("evidence_state", [
  "pending",
  "verified",
  "stale",
  "failed",
  "unknown",
  "not_applicable",
]);
export const criterionStateEnum = pgEnum("criterion_state", [
  "not_started",
  "in_progress",
  "met",
  "not_met",
  "deferred",
]);
export const receiptStateEnum = pgEnum("receipt_state", [
  "draft",
  "published",
  "accepted",
  "changes_requested",
  "superseded",
  "revoked",
]);

// Better Auth tables. Keep names and required fields aligned with its Drizzle adapter.
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);
export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);
export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("membership_workspace_user_uq").on(t.workspaceId, t.userId),
    index("membership_user_idx").on(t.userId),
  ],
);
export const invitations = pgTable(
  "workspace_invitations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: roleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("invitations_workspace_idx").on(t.workspaceId)],
);
export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("clients_workspace_idx").on(t.workspaceId)],
);
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("projects_workspace_idx").on(t.workspaceId),
    index("projects_client_idx").on(t.clientId),
  ],
);
export const githubInstallations = pgTable(
  "github_installations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    providerInstallationId: text("provider_installation_id").notNull().unique(),
    accountLogin: text("account_login").notNull(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("github_installations_workspace_idx").on(t.workspaceId)],
);
export const repositories = pgTable(
  "repositories",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    installationId: text("installation_id")
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    providerRepoId: text("provider_repo_id").notNull(),
    fullName: text("full_name").notNull(),
    private: boolean("private").notNull().default(true),
  },
  (t) => [
    uniqueIndex("repo_installation_provider_uq").on(
      t.installationId,
      t.providerRepoId,
    ),
    index("repos_workspace_idx").on(t.workspaceId),
  ],
);
export const deliveryBatches = pgTable(
  "delivery_batches",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    targetDate: timestamp("target_date", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("batches_workspace_idx").on(t.workspaceId),
    index("batches_project_idx").on(t.projectId),
  ],
);
export const criteria = pgTable(
  "criteria",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    batchId: text("batch_id")
      .notNull()
      .references(() => deliveryBatches.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    priority: text("priority").notNull(),
    statement: text("statement").notNull(),
    state: criterionStateEnum("state").notNull().default("not_started"),
  },
  (t) => [
    index("criteria_workspace_idx").on(t.workspaceId),
    index("criteria_batch_idx").on(t.batchId),
  ],
);
export const observations = pgTable(
  "source_observations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    source: text("source").notNull(),
    externalId: text("external_id"),
    url: text("url"),
    title: text("title").notNull(),
    repositoryId: text("repository_id").references(() => repositories.id, {
      onDelete: "set null",
    }),
    sha: text("sha"),
    state: evidenceStateEnum("state").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("observations_workspace_idx").on(t.workspaceId),
    index("observations_sha_idx").on(t.workspaceId, t.sha),
  ],
);
export const evidenceLinks = pgTable(
  "evidence_links",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    observationId: text("observation_id")
      .notNull()
      .references(() => observations.id, { onDelete: "cascade" }),
    batchId: text("batch_id")
      .notNull()
      .references(() => deliveryBatches.id, { onDelete: "cascade" }),
    criterionId: text("criterion_id").references(() => criteria.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [index("evidence_links_workspace_idx").on(t.workspaceId)],
);
export const receiptVersions = pgTable(
  "receipt_versions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    batchId: text("batch_id")
      .notNull()
      .references(() => deliveryBatches.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    state: receiptStateEnum("state").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    sha256: text("sha256").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("receipt_batch_version_uq").on(t.batchId, t.version),
    index("receipts_workspace_idx").on(t.workspaceId),
  ],
);
export const portalTokens = pgTable(
  "portal_tokens",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    receiptVersionId: text("receipt_version_id")
      .notNull()
      .references(() => receiptVersions.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("portal_tokens_workspace_idx").on(t.workspaceId)],
);
export const clientActions = pgTable(
  "client_actions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    receiptVersionId: text("receipt_version_id")
      .notNull()
      .references(() => receiptVersions.id),
    action: text("action").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("client_actions_workspace_idx").on(t.workspaceId)],
);
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    deliveryId: text("delivery_id").notNull(),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    state: text("state").notNull().default("received"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("webhook_provider_delivery_uq").on(t.provider, t.deliveryId),
  ],
);
export const outboxJobs = pgTable(
  "outbox_jobs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").notNull(),
    state: text("state").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("outbox_state_available_idx").on(t.state, t.availableAt)],
);
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" })
    .unique(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  plan: text("plan").notNull().default("solo"),
  status: text("status").notNull().default("disconnected"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const billingEvents = pgTable("billing_events", {
  id: text("id").primaryKey(),
  providerEventId: text("provider_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  state: text("state").notNull().default("received"),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id),
    action: text("action").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audit_workspace_time_idx").on(t.workspaceId, t.createdAt)],
);
