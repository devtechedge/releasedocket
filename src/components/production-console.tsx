"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  FileCheck2,
  Plus,
  ShieldCheck,
} from "lucide-react";

type SessionUser = { id: string; name: string; email: string };
type Workspace = { id: string; name: string; slug: string; role: string };
type Client = { id: string; name: string; email?: string | null };
type Project = { id: string; name: string; clientId: string };
type Batch = {
  id: string;
  title: string;
  summary: string;
  projectId: string;
  createdAt: string;
};
type Criterion = {
  id: string;
  statement: string;
  state: string;
  priority: string;
  evidenceCount: number;
};
type Evidence = {
  id: string;
  title: string;
  state: string;
  source: string;
  url: string | null;
  sha: string | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Request failed.");
  return result as T;
}

export function ProductionConsole() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selected, setSelected] = useState<{
    delivery: Batch;
    criteria: Criterion[];
    evidence: Evidence[];
  } | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const refresh = useCallback(async () => {
    try {
      const sessionData = await api<{ user: SessionUser } | null>(
        "/api/auth/get-session",
      );
      if (!sessionData?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(sessionData.user);
      const workspaceData = await api<{ workspaces: Workspace[] }>(
        "/api/workspaces",
      );
      const current = workspaceData.workspaces[0] ?? null;
      setWorkspace(current);
      if (current) {
        const [clientData, projectData, batchData] = await Promise.all([
          api<{ clients: Client[] }>(`/api/clients?workspaceId=${current.id}`),
          api<{ projects: Project[] }>(
            `/api/projects?workspaceId=${current.id}`,
          ),
          api<{ deliveries: Batch[] }>(
            `/api/deliveries?workspaceId=${current.id}`,
          ),
        ]);
        setClients(clientData.clients);
        setProjects(projectData.projects);
        setBatches(batchData.deliveries);
      } else {
        setClients([]);
        setProjects([]);
        setBatches([]);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not connect to the workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  async function submit(
    event: FormEvent<HTMLFormElement>,
    url: string,
    after?: () => void,
    transform?: (data: Record<string, FormDataEntryValue>) => unknown,
  ) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    try {
      await api(url, {
        method: "POST",
        body: JSON.stringify(transform ? transform(fields) : fields),
      });
      form.reset();
      after?.();
      setNotice("Saved.");
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save this change.",
      );
    }
  }
  async function authSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const fields = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    const path = mode === "signup" ? "sign-up/email" : "sign-in/email";
    try {
      await api(`/api/auth/${path}`, {
        method: "POST",
        body: JSON.stringify(fields),
      });
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    }
  }
  async function openBatch(batch: Batch) {
    setError("");
    try {
      const detail = await api<{
        delivery: Batch;
        criteria: Criterion[];
        evidence: Evidence[];
      }>(`/api/deliveries/${batch.id}?workspaceId=${workspace?.id}`);
      setSelected(detail);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load delivery.",
      );
    }
  }
  async function markCriterion(criterionId: string, state: string) {
    if (!workspace) return;
    try {
      await api(`/api/criteria/${criterionId}/status`, {
        method: "POST",
        body: JSON.stringify({ workspaceId: workspace.id, state }),
      });
      if (selected) await openBatch(selected.delivery);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update criterion.",
      );
    }
  }
  async function publish(batch: Batch) {
    if (!workspace) return;
    setError("");
    try {
      const result = await api<{
        sharePath: string;
        version: number;
        disclosures: string[];
      }>(`/api/deliveries/${batch.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ workspaceId: workspace.id }),
      });
      setShareUrl(new URL(result.sharePath, window.location.origin).toString());
      setNotice(
        `Receipt v${result.version} published with ${result.disclosures.length} disclosed gap(s).`,
      );
      await openBatch(batch);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not publish receipt.",
      );
    }
  }
  async function signOut() {
    await api("/api/auth/sign-out", { method: "POST", body: "{}" }).catch(
      () => undefined,
    );
    setUser(null);
    setWorkspace(null);
  }

  if (loading)
    return (
      <main className="prod-page">
        <div className="prod-card">
          <p>Checking your secure session…</p>
        </div>
      </main>
    );
  if (!user)
    return (
      <main className="prod-page">
        <div className="prod-brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>{" "}
          releasedocket
        </div>
        <form className="prod-card" onSubmit={authSubmit}>
          <span className="prod-kicker">AGENCY DELIVERY WORKSPACE</span>
          <h1>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p>Evidence based delivery receipts for client work.</p>
          {mode === "signup" && (
            <label>
              Your name
              <input name="name" autoComplete="name" minLength={2} required />
            </label>
          )}
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              minLength={12}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
            />
          </label>
          {error && (
            <p className="prod-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" type="submit">
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <button
            className="prod-switch"
            type="button"
            onClick={() => {
              setError("");
              setMode(mode === "signup" ? "signin" : "signup");
            }}
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New to ReleaseDocket? Create an account"}
          </button>
        </form>
      </main>
    );
  if (!workspace)
    return (
      <main className="prod-page">
        <header className="prod-brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>{" "}
          releasedocket <button onClick={signOut}>Sign out</button>
        </header>
        <form
          className="prod-card"
          onSubmit={(event) =>
            submit(event, "/api/workspaces", () => undefined)
          }
        >
          <span className="prod-kicker">STEP 1 OF 2</span>
          <h1>Create your workspace</h1>
          <p>Set up the agency workspace for {user.name}.</p>
          <label>
            Agency name
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Studio Current"
              onChange={(event) => {
                const slug = event.target.value
                  .toLowerCase()
                  .normalize("NFKD")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")
                  .slice(0, 40);
                const field = event.currentTarget.form?.elements.namedItem(
                  "slug",
                ) as HTMLInputElement | null;
                if (field) field.value = slug;
              }}
            />
          </label>
          <label>
            Workspace URL
            <input
              name="slug"
              required
              minLength={3}
              maxLength={48}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="studio-current"
            />
          </label>
          {error && (
            <p className="prod-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" type="submit">
            Create workspace
          </button>
        </form>
      </main>
    );

  const projectClient = (id: string) =>
    clients.find(
      (client) =>
        client.id === projects.find((project) => project.id === id)?.clientId,
    )?.name ?? "Client";
  return (
    <main className="prod-page">
      <header className="prod-top">
        <div className="prod-brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>{" "}
          releasedocket
        </div>
        <div>
          <b>{workspace.name}</b>
          <span>
            {user.name} · {workspace.role}
          </span>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>
      <section className="prod-welcome">
        <span className="prod-kicker">WORKSPACE</span>
        <h1>{workspace.name}</h1>
        <p>
          Connect each delivery claim to evidence, then let your client respond
          to a fixed receipt version.
        </p>
      </section>
      {error && (
        <div className="prod-alert" role="alert">
          <CircleAlert size={15} />
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      {notice && (
        <div className="prod-notice" role="status">
          <Check size={15} />
          {notice}
        </div>
      )}
      <div className="prod-columns">
        <section className="prod-card">
          <h2>
            Clients <small>{clients.length}</small>
          </h2>
          <form
            onSubmit={(event) =>
              submit(event, "/api/clients", undefined, (fields) => ({
                ...fields,
                email: fields.email ? String(fields.email) : undefined,
              }))
            }
          >
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <label>
              Client name
              <input name="name" required placeholder="Northstar Health" />
            </label>
            <label>
              Contact email{" "}
              <input
                name="email"
                type="email"
                placeholder="client@example.com"
              />
            </label>
            <button className="secondary" type="submit">
              <Plus size={14} /> Add client
            </button>
          </form>
          <ul className="prod-list">
            {clients.map((client) => (
              <li key={client.id}>
                <b>{client.name}</b>
                <span>{client.email || "No contact email"}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="prod-card">
          <h2>
            Projects <small>{projects.length}</small>
          </h2>
          <form onSubmit={(event) => submit(event, "/api/projects")}>
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <label>
              Project name
              <input name="name" required placeholder="Patient portal" />
            </label>
            <label>
              Client
              <select name="clientId" required defaultValue="">
                <option value="" disabled>
                  Select client
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary" type="submit">
              <Plus size={14} /> Add project
            </button>
          </form>
          <ul className="prod-list">
            {projects.map((project) => (
              <li key={project.id}>
                <b>{project.name}</b>
                <span>
                  {
                    clients.find((client) => client.id === project.clientId)
                      ?.name
                  }
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="prod-card prod-delivery">
        <div className="prod-card-head">
          <div>
            <h2>Delivery batches</h2>
            <p>
              {batches.length} in this workspace · GitHub sync is disconnected
            </p>
          </div>
        </div>
        <form
          className="prod-new-batch"
          onSubmit={(event) =>
            submit(event, "/api/deliveries", undefined, (fields) => ({
              ...fields,
              criteria: String(fields.criteria || "")
                .split("\n")
                .map((statement) => statement.trim())
                .filter(Boolean)
                .map((statement) => ({
                  category: "delivery",
                  priority: "normal",
                  statement,
                })),
            }))
          }
        >
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <label>
            Project
            <select name="projectId" required defaultValue="">
              <option value="" disabled>
                Select project
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} · {projectClient(project.id)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              name="title"
              required
              minLength={3}
              placeholder="October platform release"
            />
          </label>
          <label>
            Summary
            <textarea
              name="summary"
              rows={2}
              placeholder="Agency statement. Keep claims specific."
            />
          </label>
          <label>
            Acceptance criteria <span>one per line</span>
            <textarea
              name="criteria"
              rows={3}
              placeholder="Client can export monthly usage&#10;Audit entries show actor and timestamp"
            />
          </label>
          <button className="primary" type="submit">
            <Plus size={14} /> Create draft
          </button>
        </form>
        <div className="prod-batches">
          {batches.map((batch) => (
            <article key={batch.id} className="prod-batch">
              <div>
                <b>{batch.title}</b>
                <small>
                  {projectClient(batch.projectId)} ·{" "}
                  {new Date(batch.createdAt).toLocaleDateString()}
                </small>
              </div>
              <button className="secondary" onClick={() => openBatch(batch)}>
                Review evidence <ArrowUpRight size={13} />
              </button>
            </article>
          ))}
        </div>
      </section>
      {selected && (
        <section className="prod-card prod-detail">
          <div className="prod-card-head">
            <div>
              <span className="prod-kicker">DELIVERY DETAIL</span>
              <h2>{selected.delivery.title}</h2>
            </div>
            <button className="secondary" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p className="prod-disclaimer">
            Human criteria remain separate from evidence state. Publishing
            displays any gap clearly.
          </p>
          <h3>Acceptance criteria</h3>
          {selected.criteria.map((item) => (
            <div className="prod-criterion" key={item.id}>
              <div>
                <b>{item.statement}</b>
                <small>
                  {item.state} · {item.evidenceCount} mapped evidence items
                </small>
              </div>
              <select
                aria-label={`Set status for ${item.statement}`}
                value={item.state}
                onChange={(event) => markCriterion(item.id, event.target.value)}
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="met">Met</option>
                <option value="not_met">Not met</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
          ))}
          <h3>Evidence observations</h3>
          {selected.evidence.map((item) => (
            <div className="prod-criterion" key={item.id}>
              <div>
                <b>{item.title}</b>
                <small>
                  {item.source} · {item.state}
                  {item.sha ? ` · ${item.sha.slice(0, 7)}` : ""}
                </small>
              </div>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer">
                  Open source
                </a>
              )}
            </div>
          ))}
          <form
            className="prod-evidence-form"
            onSubmit={(event) =>
              submit(
                event,
                "/api/evidence",
                () => {
                  void openBatch(selected.delivery);
                },
                (fields) => ({
                  ...fields,
                  criterionId: fields.criterionId
                    ? fields.criterionId
                    : undefined,
                }),
              )
            }
          >
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <input type="hidden" name="batchId" value={selected.delivery.id} />
            <label>
              Manual evidence title
              <input
                name="title"
                required
                placeholder="Release notes or client supplied link"
              />
            </label>
            <label>
              HTTPS URL
              <input name="url" type="url" required placeholder="https://…" />
            </label>
            <label>
              Map to criterion
              <select name="criterionId" defaultValue="">
                <option value="">Batch-level evidence</option>
                {selected.criteria.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.statement}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Note
              <textarea
                name="note"
                rows={2}
                placeholder="User-supplied evidence is not independently verified."
              />
            </label>
            <input
              type="hidden"
              name="observedAt"
              value={new Date().toISOString()}
            />
            <button className="secondary" type="submit">
              <Plus size={14} /> Attach user-supplied evidence
            </button>
          </form>
          <button
            className="primary"
            onClick={() => publish(selected.delivery)}
          >
            <FileCheck2 size={15} /> Publish receipt
          </button>
          {shareUrl && (
            <div className="prod-share">
              <ShieldCheck size={15} />
              <a href={shareUrl} target="_blank" rel="noreferrer">
                Open client receipt
              </a>
              <button onClick={() => navigator.clipboard?.writeText(shareUrl)}>
                Copy link
              </button>
              <small>Private bearer link · expires in 30 days</small>
            </div>
          )}
        </section>
      )}
      <footer className="prod-footer">
        <ShieldCheck size={14} /> Evidence metadata only · Agency statements and
        client decisions remain distinct
      </footer>
    </main>
  );
}
