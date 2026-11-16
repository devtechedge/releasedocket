"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  ListFilter,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { ProductionConsole } from "@/components/production-console";

type Batch = {
  id: string;
  title: string;
  client: string;
  project: string;
  state: "Ready to publish" | "Awaiting sign-off" | "Evidence gap";
  date: string;
  count: number;
  initials: string;
  tone: string;
};
const seed: Batch[] = [
  {
    id: "DR-024",
    title: "October platform release",
    client: "Northstar Health",
    project: "Patient portal",
    state: "Ready to publish",
    date: "Oct 28, 2026",
    count: 8,
    initials: "NH",
    tone: "plum",
  },
  {
    id: "DR-023",
    title: "Billing workflow improvements",
    client: "Fieldnote",
    project: "Operations suite",
    state: "Awaiting sign-off",
    date: "Oct 24, 2026",
    count: 5,
    initials: "F",
    tone: "gold",
  },
  {
    id: "DR-022",
    title: "Onboarding automation v2",
    client: "Northstar Health",
    project: "Patient portal",
    state: "Evidence gap",
    date: "Oct 21, 2026",
    count: 3,
    initials: "NH",
    tone: "plum",
  },
  {
    id: "DR-021",
    title: "Usage export and audit trail",
    client: "Arc & Pine",
    project: "Partner dashboard",
    state: "Awaiting sign-off",
    date: "Oct 18, 2026",
    count: 6,
    initials: "AP",
    tone: "mint",
  },
];
const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Clients", icon: Users },
  { name: "Projects", icon: GitBranch },
  { name: "Delivery", icon: FileCheck2 },
  { name: "Reports", icon: BookOpenCheck },
];

export function Dashboard({ demoMode }: { demoMode: boolean }) {
  const [section, setSection] = useState("Overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All receipts");
  const [batches, setBatches] = useState(demoMode ? seed : []);
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const shown = useMemo(
    () =>
      batches.filter(
        (x) =>
          `${x.title} ${x.client} ${x.project}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (filter === "All receipts" || x.state === filter),
      ),
    [batches, query, filter],
  );
  function createBatch(form: FormData) {
    const title = String(form.get("title") || "").trim();
    if (!title) return;
    setBatches([
      {
        id: `DR-0${batches.length + 21}`,
        title,
        client: String(form.get("client") || "New client"),
        project: String(form.get("project") || "New project"),
        state: "Evidence gap",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        count: 0,
        initials: "RD",
        tone: "blue",
      },
      ...batches,
    ]);
    setModal(false);
    setNotice("Draft delivery batch created.");
    setTimeout(() => setNotice(""), 3500);
  }
  if (!demoMode) return <ProductionConsole />;
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>releasedocket</span>
        </a>
        <div className="workspace">
          <div className="workspace-avatar">S</div>
          <div>
            <b>Studio Current</b>
            <small>Agency workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Primary navigation">
          {nav.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${section === item.name ? "active" : ""}`}
              onClick={() => setSection(item.name)}
            >
              <item.icon size={17} />
              <span>{item.name}</span>
              {item.name === "Delivery" && <em>4</em>}
            </button>
          ))}
        </nav>
        <div className="nav-label integrations-label">MANAGE</div>
        <nav aria-label="Management navigation">
          {[
            { name: "Integrations", icon: GitPullRequest },
            { name: "Team", icon: Users },
            { name: "Settings", icon: Settings2 },
          ].map((item) => (
            <button
              className="nav-item"
              key={item.name}
              onClick={() => {
                setSection(item.name);
                setNotice(
                  `${item.name} settings are available in the production setup.`,
                );
                setTimeout(() => setNotice(""), 3500);
              }}
            >
              <item.icon size={17} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade">
            <div className="upgrade-icon">
              <Sparkles size={16} />
            </div>
            <b>Studio plan</b>
            <p>2 of 8 projects used</p>
            <div className="progress">
              <span />
            </div>
            <button
              onClick={() =>
                setNotice(
                  "Billing is disconnected until Stripe keys are configured.",
                )
              }
            >
              Manage plan <ArrowUpRight size={13} />
            </button>
          </div>
          <button className="profile">
            <div className="profile-avatar">AM</div>
            <div>
              <b>Alex Morgan</b>
              <small>Owner</small>
            </div>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            Workspace <span>/</span> {section}
          </div>
          <div className="top-actions">
            {demoMode ? (
              <span className="demo">
                <i /> DEMO · SYNTHETIC DATA
              </span>
            ) : (
              <span className="demo unavailable">
                <i /> WORKSPACE NOT CONNECTED
              </span>
            )}
            <button
              className="icon-button"
              aria-label="Help"
              onClick={() =>
                setNotice(
                  "Receipts separate repository evidence, agency statements and client acceptance.",
                )
              }
            >
              <CircleHelp size={17} />
            </button>
            <button
              className="icon-button notification"
              aria-label="Notifications"
              onClick={() => setNotice("No new notifications.")}
            >
              <Bell size={17} />
              <i />
            </button>
            <div className="avatar">AM</div>
          </div>
        </header>
        <div className="content">
          <div className="page-head">
            <div>
              <div className="eyebrow">
                TUESDAY, NOVEMBER 17, 2026 <span>·</span> WEEK 47
              </div>
              <h1>{section === "Overview" ? "Good morning, Alex" : section}</h1>
              <p>
                {section === "Overview"
                  ? "Here’s where delivery stands across your client work."
                  : `Track ${section.toLowerCase()} across your agency workspace.`}
              </p>
            </div>
            <div className="head-buttons">
              <button
                className="secondary"
                onClick={() =>
                  setNotice(
                    "Report export is available after a receipt exists in this workspace.",
                  )
                }
              >
                <Download size={15} /> Export report
              </button>
              {demoMode && (
                <button className="primary" onClick={() => setModal(true)}>
                  <Plus size={16} /> New delivery
                </button>
              )}
            </div>
          </div>
          {!demoMode && (
            <div className="setup-banner">
              <ShieldCheck size={20} />
              <div>
                <b>Connect a database to create your workspace.</b>
                <span>
                  This environment has no workspace configured. Demo data is
                  disabled outside development.
                </span>
              </div>
              <a href="/README.md">
                Setup guide <ExternalLink size={13} />
              </a>
            </div>
          )}
          {demoMode && (
            <>
              <div className="trust-banner">
                <div className="trust-icon">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <b>Evidence first. Clear about what shipped.</b>
                  <span>
                    GitHub facts, agency statements and client sign-off stay
                    distinct.
                  </span>
                </div>
                <button
                  onClick={() =>
                    setNotice(
                      "Evidence states distinguish verified, stale, failed and unknown observations.",
                    )
                  }
                >
                  How evidence works <ExternalLink size={13} />
                </button>
                <button className="banner-close" aria-label="Dismiss">
                  <X size={16} />
                </button>
              </div>
              <section className="metrics">
                <article className="metric">
                  <div className="metric-top">
                    <span>Published this month</span>
                    <FileCheck2 size={16} />
                  </div>
                  <div className="metric-value">
                    08{" "}
                    <span className="change positive">
                      <ArrowUpRight size={13} /> 2
                    </span>
                  </div>
                  <div className="metric-foot">
                    Receipts shared with clients
                  </div>
                  <div className="mini-bars">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </article>
                <article className="metric">
                  <div className="metric-top">
                    <span>Awaiting sign-off</span>
                    <Clock3 size={16} />
                  </div>
                  <div className="metric-value">
                    03 <span className="change neutral">2 clients</span>
                  </div>
                  <div className="metric-foot">Oldest request · 9 days ago</div>
                  <div
                    className="metric-link"
                    onClick={() => {
                      setFilter("Awaiting sign-off");
                      document
                        .querySelector(".receipts")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    View pending <ArrowUpRight size={13} />
                  </div>
                </article>
                <article className="metric">
                  <div className="metric-top">
                    <span>Evidence gaps</span>
                    <ListFilter size={16} />
                  </div>
                  <div className="metric-value">
                    02 <span className="change warning">Needs attention</span>
                  </div>
                  <div className="metric-foot">Across 2 delivery batches</div>
                  <div
                    className="metric-link"
                    onClick={() => {
                      setFilter("Evidence gap");
                      document
                        .querySelector(".receipts")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Review gaps <ArrowUpRight size={13} />
                  </div>
                </article>
                <article className="metric">
                  <div className="metric-top">
                    <span>Connected repos</span>
                    <GitBranch size={16} />
                  </div>
                  <div className="metric-value">
                    06 <span className="change neutral">3 projects</span>
                  </div>
                  <div className="metric-foot">Last sync · 18 minutes ago</div>
                  <div className="sync-ok">
                    <i /> All integrations healthy
                  </div>
                </article>
              </section>
              <section className="receipts">
                <div className="section-heading">
                  <div>
                    <h2>Delivery receipts</h2>
                    <p>Recent updates across your client projects</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setSection("Delivery")}
                  >
                    View all receipts <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="table-tools">
                  <div className="searchbox">
                    <Search size={16} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search receipts, clients, projects…"
                    />
                    <kbd>⌘ K</kbd>
                  </div>
                  <select
                    aria-label="Filter receipts"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>All receipts</option>
                    <option>Ready to publish</option>
                    <option>Awaiting sign-off</option>
                    <option>Evidence gap</option>
                  </select>
                  <button className="filter-button" aria-label="More filters">
                    <SlidersHorizontal size={15} />
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>DELIVERY BATCH</th>
                        <th>CLIENT / PROJECT</th>
                        <th>STATUS</th>
                        <th>EVIDENCE</th>
                        <th>UPDATED</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="batch-name">
                              <span>{row.id}</span>
                              <b>{row.title}</b>
                            </div>
                          </td>
                          <td>
                            <div className="client">
                              <span className={`client-avatar ${row.tone}`}>
                                {row.initials}
                              </span>
                              <div>
                                <b>{row.client}</b>
                                <small>{row.project}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status ${row.state === `Ready to publish` ? "ready" : row.state === `Awaiting sign-off` ? "pending" : "gap"}`}
                            >
                              <i />
                              {row.state}
                            </span>
                          </td>
                          <td>
                            <span className="evidence-count">
                              <ShieldCheck size={14} />
                              {row.count} items
                            </span>
                          </td>
                          <td className="date">{row.date}</td>
                          <td>
                            <button
                              className="row-more"
                              aria-label={`Actions for ${row.id}`}
                              onClick={() =>
                                setNotice(
                                  `Receipt ${row.id} is a synthetic demo record.`,
                                )
                              }
                            >
                              <MoreHorizontal size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!shown.length && (
                        <tr>
                          <td colSpan={6} className="empty">
                            No deliveries match this search. Try another filter
                            or create a delivery batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">
                  <span>
                    Showing {shown.length} of {batches.length} deliveries
                  </span>
                  <div>
                    <button disabled>← Previous</button>
                    <button disabled>Next →</button>
                  </div>
                </div>
              </section>
              <section className="bottom-grid">
                <article className="activity-card">
                  <div className="section-heading">
                    <div>
                      <h2>Recent activity</h2>
                      <p>Latest changes across your workspace</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="More activity options"
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </div>
                  <div className="activity-list">
                    <div className="activity-row">
                      <span className="activity-icon green">
                        <Check size={14} />
                      </span>
                      <div>
                        <p>
                          <b>Receipt accepted</b> by Fieldnote
                        </p>
                        <small>
                          Billing workflow improvements · 2 hours ago
                        </small>
                      </div>
                    </div>
                    <div className="activity-row">
                      <span className="activity-icon blue">
                        <GitPullRequest size={14} />
                      </span>
                      <div>
                        <p>
                          <b>Pull request merged</b> in patient-portal
                        </p>
                        <small>
                          #184 · Improve appointment reminders · 4 hours ago
                        </small>
                      </div>
                      <span className="sha">a48f2d1</span>
                    </div>
                    <div className="activity-row">
                      <span className="activity-icon amber">
                        <Clock3 size={14} />
                      </span>
                      <div>
                        <p>
                          <b>Sign-off requested</b> from Northstar Health
                        </p>
                        <small>October platform release · Yesterday</small>
                      </div>
                    </div>
                  </div>
                </article>
                <article className="attention-card">
                  <div className="attention-head">
                    <span className="attention-mark">
                      <Bell size={15} />
                    </span>
                    <div>
                      <h3>Needs your attention</h3>
                      <p>2 things are waiting on you</p>
                    </div>
                  </div>
                  <div className="attention-item">
                    <span className="attention-dot amber-dot" />
                    <div>
                      <b>Evidence needs review</b>
                      <p>Onboarding automation v2 · 1 check is stale</p>
                    </div>
                    <button
                      onClick={() => {
                        setFilter("Evidence gap");
                        document
                          .querySelector(".receipts")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Review <ArrowUpRight size={13} />
                    </button>
                  </div>
                  <div className="attention-item">
                    <span className="attention-dot blue-dot" />
                    <div>
                      <b>Connect a repository</b>
                      <p>Atlas Commerce has no linked repositories</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotice(
                          "GitHub App is disconnected until installation is configured.",
                        )
                      }
                    >
                      Connect <ArrowUpRight size={13} />
                    </button>
                  </div>
                </article>
              </section>
            </>
          )}
          <footer>
            <span>ReleaseDocket · Every delivery deserves a receipt.</span>
            <span>
              <span className="privacy">
                <ShieldCheck size={13} /> Evidence is metadata only
              </span>
              <Link href="/">Documentation</Link>
            </span>
          </footer>
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal && demoMode && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <form className="modal" action={createBatch}>
            <div className="modal-top">
              <div>
                <span className="modal-kicker">NEW DELIVERY</span>
                <h2>Create a delivery batch</h2>
                <p>
                  Start with a clear scope. Add criteria and evidence before
                  publishing.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(false)}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
            <label>
              Delivery title
              <input
                name="title"
                required
                minLength={3}
                placeholder="e.g. November platform release"
              />
            </label>
            <div className="form-pair">
              <label>
                Client
                <input name="client" required placeholder="Choose a client" />
              </label>
              <label>
                Project
                <input name="project" required placeholder="Choose a project" />
              </label>
            </div>
            <label>
              Summary
              <textarea
                name="summary"
                rows={3}
                placeholder="What was delivered? Keep claims specific."
              />
            </label>
            <div className="form-note">
              <ShieldCheck size={15} />
              <span>
                Claims need mapped evidence or a clear agency statement before
                publishing.
              </span>
            </div>
            <div className="modal-actions">
              <button
                className="secondary"
                type="button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="primary" type="submit">
                <Plus size={15} /> Create draft
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
