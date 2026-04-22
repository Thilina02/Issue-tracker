"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ModelViewer } from "@/components/model-viewer";
import { IssueDTO } from "@/types";

type User = { _id: string; name: string; email: string };
type StatusCounts = Record<"OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED", number>;

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

const statusClasses: Record<string, string> = {
  OPEN: "bg-blue-500/20 text-blue-200",
  IN_PROGRESS: "bg-amber-500/20 text-amber-200",
  RESOLVED: "bg-emerald-500/20 text-emerald-200",
  CLOSED: "bg-zinc-500/30 text-zinc-200",
};

const priorityClasses: Record<string, string> = {
  LOW: "bg-sky-500/20 text-sky-200",
  MEDIUM: "bg-violet-500/20 text-violet-200",
  HIGH: "bg-orange-500/20 text-orange-200",
  CRITICAL: "bg-rose-500/20 text-rose-200",
};

const emptyCounts: StatusCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };

const severityClasses: Record<string, string> = {
  MINOR: "bg-emerald-500/15 text-emerald-200",
  MAJOR: "bg-orange-500/15 text-orange-200",
  BLOCKER: "bg-rose-500/15 text-rose-200",
};

const statusIcon: Record<string, string> = {
  OPEN: "●",
  IN_PROGRESS: "◐",
  RESOLVED: "✓",
  CLOSED: "■",
};

const priorityIcon: Record<string, string> = {
  LOW: "↓",
  MEDIUM: "→",
  HIGH: "↑",
  CRITICAL: "!",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<IssueDTO[]>([]);
  const [counts, setCounts] = useState<StatusCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [formMessage, setFormMessage] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeIssue, setActiveIssue] = useState<IssueDTO | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<
    Pick<IssueDTO, "title" | "description" | "status" | "priority" | "severity"> | null
  >(null);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  function apiUrl(path: string) {
    if (!path.startsWith("/")) return `${API_BASE}/${path}`;
    return `${API_BASE}${path}`;
  }

  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    try {
      const res = await fetch(apiUrl(url), {
        ...init,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Request failed";
      throw new Error(msg.includes("Failed to fetch") ? "Backend server is not reachable" : msg);
    }
  }

  async function fetchSessionAndIssues() {
    try {
      const me = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
      if (!me.ok) {
        setUser(null);
        setIssues([]);
        setCounts(emptyCounts);
        setLoading(false);
        return;
      }
      const meData = await me.json();
      setUser(meData.user);
      await fetchIssues();
    } catch {
      // If backend is down/unreachable, keep UI stable as logged out.
      setUser(null);
      setIssues([]);
      setCounts(emptyCounts);
    } finally {
      setLoading(false);
    }
  }

  async function fetchIssues() {
    try {
      const params = new URLSearchParams({
        q,
        status,
        priority,
        page: String(page),
        limit: "8",
      });
      const data = await request<{
        issues: IssueDTO[];
        statusCounts: StatusCounts;
        totalPages: number;
      }>(`/api/issues?${params.toString()}`);
      setIssues(data.issues);
      setCounts(data.statusCounts);
      setTotalPages(data.totalPages);
      setApiError("");
    } catch (error) {
      setIssues([]);
      setCounts(emptyCounts);
      setApiError((error as Error).message);
    }
  }

  useEffect(() => {
    fetchSessionAndIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchIssues().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, priority, page, user?._id]);

  const countCards = useMemo(
    () => [
      { key: "OPEN", label: "Open", value: counts.OPEN },
      { key: "IN_PROGRESS", label: "In Progress", value: counts.IN_PROGRESS },
      { key: "RESOLVED", label: "Resolved", value: counts.RESOLVED },
      { key: "CLOSED", label: "Closed", value: counts.CLOSED },
    ],
    [counts],
  );

  async function onAuthSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormMessage("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    };
    try {
      await request(`/api/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setFormMessage("Authentication successful");
      (e.target as HTMLFormElement).reset();
      await fetchSessionAndIssues();
    } catch (error) {
      setFormMessage((error as Error).message);
    }
  }

  async function createIssue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await request("/api/issues", {
      method: "POST",
      body: JSON.stringify({
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        priority: String(fd.get("priority") || "MEDIUM"),
        severity: String(fd.get("severity") || "MINOR"),
      }),
    });
    (e.target as HTMLFormElement).reset();
    await fetchIssues();
  }

  async function updateIssue(id: string, patch: Partial<IssueDTO>) {
    await request(`/api/issues/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    await fetchIssues();
    if (activeIssue?._id === id) {
      const details = await request<IssueDTO>(`/api/issues/${id}`);
      setActiveIssue(details);
    }
  }

  function startEdit(issue: IssueDTO) {
    setIsEditing(true);
    setEditDraft({
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      severity: issue.severity,
    });
  }

  async function exportIssues(format: "csv" | "json") {
    const res = await fetch(apiUrl(`/api/issues/export?format=${format}`), { credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Export failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function deleteIssue(id: string) {
    if (!confirm("Delete this issue permanently?")) return;
    await request(`/api/issues/${id}`, { method: "DELETE" });
    setActiveIssue(null);
    await fetchIssues();
  }

  async function markResolved(id: string) {
    if (!confirm("Mark this issue as resolved?")) return;
    await updateIssue(id, { status: "RESOLVED" });
  }

  async function logout() {
    await request("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIssues([]);
    setCounts(emptyCounts);
    setActiveIssue(null);
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.35),transparent_45%),radial-gradient(circle_at_90%_15%,rgba(34,211,238,0.35),transparent_35%)] px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Issue Tracker</h1>
            <p className="text-zinc-400">Cinematic dashboard with secure APIs</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={logout}
                className="rounded-full border border-white/20 bg-zinc-900 px-4 py-2 text-sm text-white"
              >
                Logout
              </button>
            ) : null}
          </div>
        </header>

        {!user ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <ModelViewer />
            <form
              onSubmit={onAuthSubmit}
              className="space-y-4 rounded-3xl border border-white/15 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm",
                    authMode === "login" ? "bg-zinc-100 text-zinc-900" : "border border-zinc-600 text-zinc-200",
                  )}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm",
                    authMode === "register" ? "bg-zinc-100 text-zinc-900" : "border border-zinc-600 text-zinc-200",
                  )}
                >
                  Register
                </button>
              </div>
              {authMode === "register" ? (
                <input
                  name="name"
                  placeholder="Full name"
                  className="w-full rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                  required
                />
              ) : null}
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password (min 8)"
                className="w-full rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                required
              />
              <button className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 py-2 font-semibold text-white">
                {authMode === "login" ? "Sign In" : "Create Account"}
              </button>
              {formMessage ? <p className="text-sm">{formMessage}</p> : null}
              {apiError ? <p className="text-sm text-rose-300">{apiError}</p> : null}
            </form>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {countCards.map((c) => (
                <article key={c.key} className="rounded-2xl border border-white/15 bg-zinc-900/70 p-4 backdrop-blur">
                  <p className="text-sm text-zinc-400">{c.label}</p>
                  <p className="mt-2 text-3xl font-bold">{c.value}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-4 rounded-3xl border border-white/15 bg-zinc-900/70 p-4 backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Search by title or description..."
                    className="min-w-52 flex-1 rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                  />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                  >
                    <option value="">All status</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                  >
                    <option value="">All priority</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                      onClick={async () => {
                        try {
                          await exportIssues("csv");
                        } catch (e) {
                          alert((e as Error).message);
                        }
                      }}
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                      onClick={async () => {
                        try {
                          await exportIssues("json");
                        } catch (e) {
                          alert((e as Error).message);
                        }
                      }}
                    >
                      Export JSON
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {apiError ? <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{apiError}</p> : null}
                  {issues.map((issue) => (
                    <article
                      key={issue._id}
                      className="cursor-pointer rounded-2xl border border-white/10 bg-zinc-950/40 p-4 transition hover:-translate-y-0.5"
                      onClick={async () => {
                        setActiveIssue(await request<IssueDTO>(`/api/issues/${issue._id}`));
                        setIsEditing(false);
                        setEditDraft(null);
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <Badge label={`${statusIcon[issue.status]} ${issue.status}`} className={statusClasses[issue.status]} />
                        <Badge
                          label={`${priorityIcon[issue.priority]} ${issue.priority}`}
                          className={priorityClasses[issue.priority]}
                        />
                        <Badge label={`⚑ ${issue.severity}`} className={severityClasses[issue.severity]} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{issue.description}</p>
                    </article>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-xl border px-3 py-2 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl border px-3 py-2 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <ModelViewer />
                <form onSubmit={createIssue} className="space-y-3 rounded-3xl border border-white/15 bg-zinc-900/70 p-4 backdrop-blur">
                  <h2 className="text-lg font-semibold">Create new issue</h2>
                  <input
                    name="title"
                    placeholder="Title"
                    className="w-full rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                    required
                  />
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Description"
                    className="w-full rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                    required
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select name="priority" className="rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100">
                      <option value="MEDIUM">Priority: Medium</option>
                      <option value="LOW">Low</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                    <select name="severity" className="rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100">
                      <option value="MINOR">Severity: Minor</option>
                      <option value="MAJOR">Major</option>
                      <option value="BLOCKER">Blocker</option>
                    </select>
                  </div>
                  <button className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-semibold text-white">
                    Create Issue
                  </button>
                </form>

                {activeIssue ? (
                  <article className="space-y-3 rounded-3xl border border-white/15 bg-zinc-900/70 p-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{activeIssue.title}</h3>
                        <p className="mt-1 text-sm text-zinc-300">{activeIssue.description}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-xl border border-zinc-700 px-3 py-2 text-sm"
                        onClick={() => startEdit(activeIssue)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        label={`${statusIcon[activeIssue.status]} ${activeIssue.status}`}
                        className={statusClasses[activeIssue.status]}
                      />
                      <Badge
                        label={`${priorityIcon[activeIssue.priority]} ${activeIssue.priority}`}
                        className={priorityClasses[activeIssue.priority]}
                      />
                      <Badge label={`⚑ ${activeIssue.severity}`} className={severityClasses[activeIssue.severity]} />
                    </div>

                    {isEditing && editDraft ? (
                      <form
                        className="space-y-3 rounded-2xl border border-white/10 bg-zinc-950/40 p-3"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await updateIssue(activeIssue._id, editDraft);
                          setIsEditing(false);
                          setEditDraft(null);
                        }}
                      >
                        <input
                          value={editDraft.title}
                          onChange={(e) => setEditDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                          className="w-full rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                          required
                        />
                        <textarea
                          value={editDraft.description}
                          onChange={(e) => setEditDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                          rows={4}
                          className="w-full rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                          required
                        />
                        <div className="grid gap-2 sm:grid-cols-3">
                          <select
                            value={editDraft.status}
                            onChange={(e) =>
                              setEditDraft((d) => (d ? { ...d, status: e.target.value as IssueDTO["status"] } : d))
                            }
                            className="rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                          <select
                            value={editDraft.priority}
                            onChange={(e) =>
                              setEditDraft((d) => (d ? { ...d, priority: e.target.value as IssueDTO["priority"] } : d))
                            }
                            className="rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                          <select
                            value={editDraft.severity}
                            onChange={(e) =>
                              setEditDraft((d) => (d ? { ...d, severity: e.target.value as IssueDTO["severity"] } : d))
                            }
                            className="rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-zinc-100"
                          >
                            <option value="MINOR">Minor</option>
                            <option value="MAJOR">Major</option>
                            <option value="BLOCKER">Blocker</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900">Save</button>
                          <button
                            type="button"
                            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm"
                            onClick={() => {
                              setIsEditing(false);
                              setEditDraft(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateIssue(activeIssue._id, { status: "IN_PROGRESS" })}
                        className="rounded-xl border px-3 py-2 text-sm"
                      >
                        In Progress
                      </button>
                      <button onClick={() => markResolved(activeIssue._id)} className="rounded-xl border px-3 py-2 text-sm">
                        Resolve
                      </button>
                      <button
                        onClick={() => updateIssue(activeIssue._id, { status: "CLOSED" })}
                        className="rounded-xl border px-3 py-2 text-sm"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => deleteIssue(activeIssue._id)}
                        className="rounded-xl border px-3 py-2 text-sm text-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

