"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, FileCheck2, ShieldCheck } from "lucide-react";

type ReceiptData = {
  title: string;
  summary: string;
  criteria: Array<{ id: string; statement: string; priority: string }>;
  evidence: Array<{
    id: string;
    title: string;
    kind: string;
    source: string;
    state: string;
    url: string | null;
    sha: string | null;
  }>;
  disclosures: string[];
  version: number;
};

export function ClientReceipt({ token }: { token: string }) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`/api/portal/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setReceipt(data.receipt);
        setState(data.state);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load this receipt.",
        ),
      );
  }, [token]);
  async function decide(action: "accept" | "request_changes") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState(data.state);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Action could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="portal-page">
      <header className="portal-brand">
        <span className="brand-mark">
          <span />
          <span />
          <span />
          <span />
        </span>{" "}
        releasedocket <span className="portal-tag">CLIENT RECEIPT</span>
      </header>
      {receipt ? (
        <article className="portal-card">
          <div className="portal-kicker">
            <FileCheck2 size={15} /> DELIVERY RECEIPT{" "}
            <span>VERSION {receipt.version}</span>
          </div>
          <h1>{receipt.title}</h1>
          <p className="portal-summary">
            {receipt.summary || "No additional summary was provided."}
          </p>
          <div className="portal-disclosure">
            <CircleAlert size={17} />
            <div>
              <b>Evidence and delivery statements</b>
              <p>
                A receipt records what the agency reports and the linked
                observations. Passing checks and merged changes do not prove
                client acceptance or feature behavior.
              </p>
            </div>
          </div>
          <section>
            <h2>Acceptance criteria</h2>
            {receipt.criteria.length ? (
              receipt.criteria.map((item) => (
                <div className="portal-row" key={item.id}>
                  <span>{item.priority}</span>
                  {item.statement}
                </div>
              ))
            ) : (
              <p className="portal-muted">
                No acceptance criteria were recorded.
              </p>
            )}
          </section>
          <section>
            <h2>
              Evidence <small>{receipt.evidence.length} linked items</small>
            </h2>
            {receipt.evidence.length ? (
              receipt.evidence.map((item) => (
                <div className="portal-evidence" key={item.id}>
                  <ShieldCheck size={16} />
                  <div>
                    <b>{item.title}</b>
                    <small>
                      {item.source === "user_supplied"
                        ? "User supplied · not independently verified"
                        : `${item.kind} · ${item.state}`}
                      {item.sha ? ` · ${item.sha.slice(0, 7)}` : ""}
                    </small>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="portal-muted">No evidence was attached.</p>
            )}
          </section>
          {receipt.disclosures.length > 0 && (
            <section className="portal-gaps">
              <h2>Disclosed gaps</h2>
              <ul>
                {receipt.disclosures.map((gap, index) => (
                  <li key={`${index}-${gap}`}>{gap}</li>
                ))}
              </ul>
            </section>
          )}
          <div className="portal-response">
            <h2>Client response</h2>
            {state === "accepted" ? (
              <div className="portal-state accepted">
                <Check size={16} /> You accepted this receipt version.
              </div>
            ) : state === "changes_requested" ? (
              <div className="portal-state">
                Changes were requested on this receipt version.
              </div>
            ) : (
              <>
                <label htmlFor="client-comment">
                  Comment <span>(required when requesting changes)</span>
                </label>
                <textarea
                  id="client-comment"
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a note for your delivery team…"
                />
                <div className="portal-actions">
                  <button
                    disabled={busy}
                    onClick={() => decide("request_changes")}
                  >
                    Request changes
                  </button>
                  <button
                    disabled={busy}
                    className="portal-accept"
                    onClick={() => decide("accept")}
                  >
                    <Check size={15} /> Accept delivery
                  </button>
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="portal-error">
                {error}
              </p>
            )}
          </div>
        </article>
      ) : (
        <article className="portal-card portal-loading">
          <h1>{error ? "Receipt unavailable" : "Loading receipt…"}</h1>
          <p>{error || "Checking the secure client link."}</p>
        </article>
      )}
      <footer className="portal-footer">
        This link is private and expires. Receipt actions are saved with this
        version.
      </footer>
    </main>
  );
}
