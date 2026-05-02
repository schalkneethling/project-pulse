import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useProjects } from "./hooks/useProjects";
import { useSettings } from "./hooks/useSettings";
import { useTodos } from "./hooks/useTodos";
import { LoginScreen } from "./components/LoginScreen";
import { TodoForm, TodoList, TodoCard } from "./components/Todos";
import { daysSince, fmtDate, fmtDateTime, fmtDuration, timeAgo } from "./lib/helpers";

/* ─── constants ──────────────────────────────────────────── */
const STATUS = {
  active: { label: "Active", color: "bg-emerald-500", text: "text-emerald-400" },
  paused: { label: "Paused", color: "bg-amber-500", text: "text-amber-400" },
  blocked: { label: "Blocked", color: "bg-red-500", text: "text-red-400" },
  done: { label: "Done", color: "bg-slate-500", text: "text-slate-400" },
};

const TASK_STATUS = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

const DEPLOY_STATUS = {
  ready: { label: "Published", color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-900/40", dot: "bg-emerald-500" },
  building: { label: "Building", color: "text-blue-400", bg: "bg-blue-950/30", border: "border-blue-900/40", dot: "bg-blue-500 animate-pulse" },
  enqueued: { label: "Queued", color: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-900/40", dot: "bg-amber-500" },
  error: { label: "Failed", color: "text-red-400", bg: "bg-red-950/30", border: "border-red-900/40", dot: "bg-red-500" },
  none: { label: "No deploys", color: "text-slate-500", bg: "bg-slate-800/40", border: "border-slate-700/50", dot: "bg-slate-600" },
};

/* ─── icons ──────────────────────────────────────────────── */
function Ico({ size = 20, sw = 2, children }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
function IconPlus({ size = 20 }) { return <Ico size={size}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Ico>; }
function IconBack({ size = 20 }) { return <Ico size={size}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Ico>; }
function IconCheck({ size = 16 }) { return <Ico size={size} sw={2.5}><polyline points="20 6 9 17 4 12" /></Ico>; }
function IconTrash({ size = 16 }) { return <Ico size={size}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Ico>; }
function IconEdit({ size = 16 }) { return <Ico size={size}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Ico>; }
function IconAlert({ size = 18 }) { return <Ico size={size}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Ico>; }
function IconClock({ size = 16 }) { return <Ico size={size}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Ico>; }
function IconGlobe({ size = 16 }) { return <Ico size={size}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Ico>; }
function IconRocket({ size = 16 }) { return <Ico size={size}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></Ico>; }
function IconExternal({ size = 14 }) { return <Ico size={size}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></Ico>; }
function IconBranch({ size = 14 }) { return <Ico size={size}><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></Ico>; }
function IconCommit({ size = 14 }) { return <Ico size={size}><circle cx="12" cy="12" r="4" /><line x1="1.05" y1="12" x2="7" y2="12" /><line x1="17.01" y1="12" x2="22.96" y2="12" /></Ico>; }
function IconLogout({ size = 18 }) { return <Ico size={size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Ico>; }
function IconSettings({ size = 18 }) { return <Ico size={size}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Ico>; }
function IconRefresh({ size = 16 }) { return <Ico size={size}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></Ico>; }
function IconGithub({ size = 16 }) { return <Ico size={size}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></Ico>; }
function IconPR({ size = 14 }) { return <Ico size={size}><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><line x1="6" y1="9" x2="6" y2="21" /></Ico>; }
function IconIssue({ size = 14 }) { return <Ico size={size}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Ico>; }

/* ─── small UI pieces ────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.active;
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium"><span className={`inline-block w-2 h-2 rounded-full ${s.color}`} aria-hidden="true" /><span className={s.text}>{s.label}</span></span>;
}

function Stale({ updatedAt }) {
  const days = daysSince(updatedAt);
  if (days === null || days < 7) return null;
  const label = days >= 30 ? `${Math.floor(days / 30)}mo stale` : `${days}d stale`;
  return <span className={`inline-flex items-center gap-1 text-xs ${days >= 14 ? "text-red-400" : "text-amber-400"}`} title={`Last updated ${fmtDate(updatedAt)}`}><IconClock size={12} />{label}</span>;
}

function DeployBadge({ netlify }) {
  if (!netlify?.lastDeploy) return null;
  const ds = DEPLOY_STATUS[netlify.lastDeploy.state] || DEPLOY_STATUS.none;
  return <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ds.color}`}><span className={`inline-block w-2 h-2 rounded-full ${ds.dot}`} aria-hidden="true" />{ds.label}</span>;
}

function GitHubBadge({ github }) {
  if (!github?.activity) { return null; }
  const { openPrs, totalIssues } = github.activity;
  if (openPrs === 0 && totalIssues === 0) { return null; }

  const parts = [];
  if (openPrs > 0) { parts.push(`${openPrs} PR${openPrs !== 1 ? "s" : ""}`); }
  if (totalIssues > 0) { parts.push(`${totalIssues} issue${totalIssues !== 1 ? "s" : ""}`); }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <IconGithub size={11} />
      {parts.join(" · ")}
    </span>
  );
}

/* ─── deploy card ────────────────────────────────────────── */
function DeployCard({ netlify, onEdit, onRemove, onSync, syncing }) {
  if (!netlify) {
    return <button onClick={onEdit} className="w-full rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors flex items-center justify-center gap-2"><IconRocket size={18} />Link Netlify site</button>;
  }
  const deploy = netlify.lastDeploy;
  const ds = deploy ? (DEPLOY_STATUS[deploy.state] || DEPLOY_STATUS.none) : DEPLOY_STATUS.none;

  return (
    <div className={`rounded-xl ${ds.bg} border ${ds.border} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2"><IconRocket size={18} /><h3 className="text-sm font-semibold text-slate-200">Netlify Deploy</h3></div>
        <div className="flex items-center gap-2">
          <button onClick={onSync} disabled={syncing} className={`text-slate-500 hover:text-slate-300 transition-colors ${syncing ? "animate-spin" : ""}`} aria-label="Sync Netlify deploys"><IconRefresh size={14} /></button>
          <button onClick={onEdit} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Edit Netlify settings"><IconEdit size={14} /></button>
          <button onClick={onRemove} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Remove Netlify link"><IconTrash size={14} /></button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ds.color}`}><span className={`inline-block w-2.5 h-2.5 rounded-full ${ds.dot}`} aria-hidden="true" />{ds.label}</span>
          {deploy?.publishedAt && <span className="text-xs text-slate-500">{timeAgo(deploy.publishedAt)}</span>}
        </div>
        {netlify.siteName && <div className="flex items-center gap-2 text-xs text-slate-400"><IconGlobe size={12} /><span className="truncate">{netlify.siteName}</span>{netlify.url && <a href={netlify.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 shrink-0"><IconExternal size={12} /></a>}</div>}
        {deploy?.branch && <div className="flex items-center gap-2 text-xs text-slate-500"><IconBranch size={12} /><span>{deploy.branch}</span></div>}
        {deploy?.commitMessage && <div className="flex items-start gap-2 text-xs text-slate-500"><span className="shrink-0 mt-0.5"><IconCommit size={12} /></span><span className="line-clamp-2">{deploy.commitMessage}</span></div>}
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
          {deploy?.deployTime && <span>Built in {fmtDuration(deploy.deployTime)}</span>}
          {deploy?.createdAt && <span>{fmtDateTime(deploy.createdAt)}</span>}
        </div>
        {deploy?.errorMessage && <p className="text-xs text-red-400 bg-red-950/40 rounded-lg p-2 mt-1">{deploy.errorMessage}</p>}
      </div>
    </div>
  );
}

/* ─── netlify modal ──────────────────────────────────────── */
function NetlifyModal({ netlify, onSave, onClose }) {
  const [form, setForm] = useState({
    siteId: netlify?.siteId || "", siteName: netlify?.siteName || "", url: netlify?.url || "",
    state: netlify?.lastDeploy?.state || "ready", branch: netlify?.lastDeploy?.branch || "main",
    commitMessage: netlify?.lastDeploy?.commitMessage || "", deployTime: netlify?.lastDeploy?.deployTime || "",
    errorMessage: netlify?.lastDeploy?.errorMessage || "",
  });
  const ic = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-xs text-slate-400 uppercase tracking-wider mb-1";

  const handleSave = () => {
    if (!form.siteName.trim()) return;
    onSave({
      siteId: form.siteId.trim(), siteName: form.siteName.trim(), url: form.url.trim(),
      lastDeploy: {
        state: form.state, createdAt: new Date().toISOString(),
        publishedAt: form.state === "ready" ? new Date().toISOString() : null,
        deployTime: form.deployTime ? parseInt(form.deployTime, 10) : null,
        errorMessage: form.state === "error" ? form.errorMessage.trim() : null,
        branch: form.branch.trim() || "main", commitMessage: form.commitMessage.trim() || null,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Link Netlify site">
        <h2 className="text-lg font-semibold text-slate-200">Link Netlify Site</h2>
        <p className="text-xs text-slate-400">Link a Netlify site to track deploy status. Add your API token in Settings to enable auto-sync.</p>
        <div><label className={lc}>Site name</label><input type="text" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} placeholder="my-awesome-site" className={ic} /></div>
        <div><label className={lc}>Site URL</label><input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://my-awesome-site.netlify.app" className={ic} /></div>
        <div><label className={lc}>Netlify Site ID (for future API sync)</label><input type="text" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={ic} /></div>
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Latest Deploy Status</h3>
          <div className="space-y-3">
            <div><label className={lc}>Status</label><select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={ic}><option value="ready">Published</option><option value="building">Building</option><option value="enqueued">Queued</option><option value="error">Failed</option></select></div>
            <div><label className={lc}>Branch</label><input type="text" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="main" className={ic} /></div>
            <div><label className={lc}>Last commit message</label><input type="text" value={form.commitMessage} onChange={(e) => setForm({ ...form, commitMessage: e.target.value })} placeholder="fix: update header styles" className={ic} /></div>
            <div><label className={lc}>Build time (seconds)</label><input type="number" value={form.deployTime} onChange={(e) => setForm({ ...form, deployTime: e.target.value })} placeholder="120" className={ic} /></div>
            {form.state === "error" && <div><label className={lc}>Error message</label><textarea value={form.errorMessage} onChange={(e) => setForm({ ...form, errorMessage: e.target.value })} placeholder="Build failed: ..." rows={2} className={ic + " resize-none"} /></div>}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={!form.siteName.trim()} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">Save</button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── settings modal ────────────────────────────────────── */
function SettingsModal({ onClose, saveTokens }) {
  const [netlifyToken, setNetlifyToken] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const ic = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-xs text-slate-400 uppercase tracking-wider mb-1";

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (netlifyToken) updates.netlifyToken = netlifyToken;
    if (githubToken) updates.githubToken = githubToken;
    await saveTokens(updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Settings">
        <h2 className="text-lg font-semibold text-slate-200">Settings</h2>
        <p className="text-xs text-slate-400">API tokens are stored securely and cannot be read back after saving. Enter a new value to update.</p>
        <div>
          <label className={lc}>Netlify Personal Access Token</label>
          <input type="password" value={netlifyToken} onChange={(e) => setNetlifyToken(e.target.value)} placeholder="Enter token to save or update" className={ic} />
          <p className="text-xs text-slate-500 mt-1">Used to auto-sync deploy status from Netlify.</p>
        </div>
        <div>
          <label className={lc}>GitHub Personal Access Token</label>
          <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="Enter token to save or update" className={ic} />
          <p className="text-xs text-slate-500 mt-1">Used to sync PRs, issues, and commit activity from GitHub.</p>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving || (!netlifyToken && !githubToken)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── github repo modal ─────────────────────────────────── */
function GitHubModal({ github, onSave, onClose }) {
  const [owner, setOwner] = useState(github?.owner || "");
  const [repo, setRepo] = useState(github?.repo || "");
  const ic = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-xs text-slate-400 uppercase tracking-wider mb-1";

  const handleSave = () => {
    if (!owner.trim() || !repo.trim()) return;
    onSave({ owner: owner.trim(), repo: repo.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Link GitHub repository">
        <h2 className="text-lg font-semibold text-slate-200">Link GitHub Repo</h2>
        <div><label className={lc}>Owner / Organization</label><input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. schalkneethling" className={ic} /></div>
        <div><label className={lc}>Repository</label><input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="e.g. project-pulse" className={ic} /></div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={!owner.trim() || !repo.trim()} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">Save</button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function GitHubItemList({ title, items, icon, fallbackTitle, itemClassName, linkClassName }) {
  if (!items.length) return null;

  return (
    <section className="pt-2" aria-labelledby={`github-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <h4 id={`github-${title.toLowerCase().replace(/\s+/g, "-")}`} className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}{title}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id || item.url || item.number}>
            <article className={`rounded-lg bg-slate-900/50 border ${itemClassName} p-3`}>
              <div className="flex items-start justify-between gap-3">
                <header className="min-w-0">
                  <h5 className="text-sm font-medium text-slate-200 line-clamp-2">{item.title || fallbackTitle}</h5>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.number ? `#${item.number} · ` : ""}Opened {fmtDate(item.openedAt)}
                  </p>
                </header>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${linkClassName}`}>
                    <IconExternal size={12} />
                    View
                  </a>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─── github activity card ──────────────────────────────── */
function GitHubCard({ github, onEdit, onRemove, onSync, syncing }) {
  if (!github) {
    return <button onClick={onEdit} className="w-full rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors flex items-center justify-center gap-2"><IconGithub size={18} />Link GitHub repo</button>;
  }

  const activity = github.activity;
  const reviewRequestedPrDetails = activity?.reviewRequestedPrDetails || [];
  const assignedIssueDetails = activity?.assignedIssueDetails || [];

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2"><IconGithub size={18} /><h3 className="text-sm font-semibold text-slate-200">GitHub</h3></div>
        <div className="flex items-center gap-2">
          <button onClick={onSync} disabled={syncing} className={`text-slate-500 hover:text-slate-300 transition-colors ${syncing ? "animate-spin" : ""}`} aria-label="Sync GitHub activity"><IconRefresh size={14} /></button>
          <button onClick={onEdit} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Edit GitHub settings"><IconEdit size={14} /></button>
          <button onClick={onRemove} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Remove GitHub link"><IconTrash size={14} /></button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="truncate">{github.owner}/{github.repo}</span>
          <a href={`https://github.com/${github.owner}/${github.repo}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 shrink-0"><IconExternal size={12} /></a>
        </div>
        {activity ? (
          <>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-2 text-center">
                <p className="text-lg font-bold text-blue-400">{activity.openPrs}</p>
                <p className="text-xs text-slate-500">Open PRs</p>
              </div>
              <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-2 text-center">
                <p className={`text-lg font-bold ${activity.reviewRequestedPrs > 0 ? "text-amber-400" : "text-slate-400"}`}>{activity.reviewRequestedPrs}</p>
                <p className="text-xs text-slate-500">Review</p>
              </div>
              <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-2 text-center">
                <p className={`text-lg font-bold ${activity.totalIssues > 0 ? "text-red-400" : "text-slate-400"}`}>{activity.totalIssues}</p>
                <p className="text-xs text-slate-500">Issues</p>
                {activity.assignedIssues > 0 && (
                  <p className="text-xs text-slate-600 leading-tight">{activity.assignedIssues} assigned</p>
                )}
              </div>
            </div>
            <GitHubItemList
              title="Pull Requests Awaiting Review"
              items={reviewRequestedPrDetails}
              icon={<IconPR size={12} />}
              fallbackTitle="Untitled pull request"
              itemClassName="border-amber-900/30"
              linkClassName="bg-amber-600/20 border-amber-500/30 text-amber-200 hover:bg-amber-600/30"
            />
            <GitHubItemList
              title="Assigned Issues"
              items={assignedIssueDetails}
              icon={<IconIssue size={12} />}
              fallbackTitle="Untitled issue"
              itemClassName="border-purple-900/30"
              linkClassName="bg-purple-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30"
            />
            {activity.latestCommitMessage && (
              <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                <span className="shrink-0 mt-0.5"><IconCommit size={12} /></span>
                <span className="line-clamp-2">{activity.latestCommitMessage}</span>
              </div>
            )}
            {activity.syncedAt && <p className="text-xs text-slate-600">Synced {timeAgo(activity.syncedAt)}</p>}
          </>
        ) : (
          <p className="text-xs text-slate-500">No activity data yet. Click refresh to sync.</p>
        )}
      </div>
    </div>
  );
}

/* ─── overview ───────────────────────────────────────────── */
function Overview({ projects, onSelect }) {
  const active = projects.filter((p) => p.status === "active");
  const blocked = projects.filter((p) => p.status === "blocked");
  const stale = projects.filter((p) => p.status === "active" && daysSince(p.updatedAt) >= 7);
  const blockedTasks = projects.flatMap((p) => p.tasks.filter((t) => t.status === "blocked").map((t) => ({ ...t, pName: p.name, pId: p.id })));
  const inProgress = projects.flatMap((p) => p.tasks.filter((t) => t.status === "in_progress").map((t) => ({ ...t, pName: p.name, pId: p.id })));
  const nextSteps = projects.filter((p) => p.nextStep && (p.status === "active" || p.status === "blocked"));
  const deployAlerts = projects.filter((p) => { const s = p.netlify?.lastDeploy?.state; return s === "error" || s === "building"; });
  const reviewPRs = projects.filter((p) => p.github?.activity?.reviewRequestedPrs > 0);
  const assignedIssues = projects.filter((p) => p.github?.activity?.assignedIssues > 0);
  const ghStale = projects.filter((p) => {
    if (!p.github?.activity?.latestCommitAt || p.status !== "active") return false;
    return daysSince(p.github.activity.latestCommitAt) >= 7;
  });

  return (
    <div className="space-y-8">
      <header><h1 className="text-3xl font-bold tracking-tight text-slate-100">Project Pulse</h1><p className="mt-1 text-slate-400">What needs your attention right now</p></header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[{ l: "Active", v: active.length, c: "text-emerald-400" }, { l: "Blocked", v: blocked.length, c: "text-red-400" }, { l: "In Progress", v: inProgress.length, c: "text-blue-400" }, { l: "Stale (7d+)", v: stale.length + ghStale.filter((p) => !stale.includes(p)).length, c: "text-amber-400" }].map((x) => (
          <div key={x.l} className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4"><p className="text-xs text-slate-400 uppercase tracking-wider">{x.l}</p><p className={`mt-1 text-2xl font-bold ${x.c}`}>{x.v}</p></div>
        ))}
      </div>

      {deployAlerts.length > 0 && <section><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200 mb-3"><IconRocket size={20} />Deploy Alerts</h2><div className="space-y-2">{deployAlerts.map((p) => { const ds = DEPLOY_STATUS[p.netlify.lastDeploy.state]; return <button key={p.id} onClick={() => onSelect(p.id)} className={`w-full text-left rounded-lg ${ds.bg} border ${ds.border} p-3 hover:brightness-125 transition-all`}><div className="flex items-center justify-between"><span className="font-medium text-slate-200">{p.name}</span><DeployBadge netlify={p.netlify} /></div>{p.netlify.lastDeploy.errorMessage && <p className="mt-1 text-xs text-red-400 truncate">{p.netlify.lastDeploy.errorMessage}</p>}</button>; })}</div></section>}

      {(reviewPRs.length > 0 || assignedIssues.length > 0) && <section><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200 mb-3"><IconGithub size={20} />GitHub Activity</h2><div className="space-y-2">{reviewPRs.map((p) => <button key={`pr-${p.id}`} onClick={() => onSelect(p.id)} className="w-full text-left rounded-lg bg-amber-950/20 border border-amber-900/30 p-3 hover:bg-amber-950/40 transition-colors"><div className="flex items-center justify-between"><span className="font-medium text-slate-200">{p.name}</span><span className="text-xs text-amber-400 flex items-center gap-1"><IconPR size={12} />{p.github.activity.reviewRequestedPrs} PR{p.github.activity.reviewRequestedPrs !== 1 ? "s" : ""} awaiting review</span></div></button>)}{assignedIssues.map((p) => <button key={`iss-${p.id}`} onClick={() => onSelect(p.id)} className="w-full text-left rounded-lg bg-purple-950/20 border border-purple-900/30 p-3 hover:bg-purple-950/40 transition-colors"><div className="flex items-center justify-between"><span className="font-medium text-slate-200">{p.name}</span><span className="text-xs text-purple-400 flex items-center gap-1"><IconIssue size={12} />{p.github.activity.assignedIssues} assigned issue{p.github.activity.assignedIssues !== 1 ? "s" : ""}</span></div></button>)}</div></section>}

      {(blocked.length > 0 || blockedTasks.length > 0) && <section><h2 className="flex items-center gap-2 text-lg font-semibold text-red-400 mb-3"><IconAlert size={20} />Blocked on You</h2><div className="space-y-2">{blocked.map((p) => <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-lg bg-red-950/30 border border-red-900/40 p-3 hover:bg-red-950/50 transition-colors"><span className="font-medium text-slate-200">{p.name}</span>{p.nextStep && <p className="mt-1 text-sm text-slate-400">Next: {p.nextStep}</p>}</button>)}{blockedTasks.map((t) => <button key={t.id} onClick={() => onSelect(t.pId)} className="w-full text-left rounded-lg bg-red-950/20 border border-red-900/30 p-3 hover:bg-red-950/40 transition-colors"><span className="text-sm text-slate-400">{t.pName}</span><p className="font-medium text-slate-200">{t.title}</p></button>)}</div></section>}

      {nextSteps.length > 0 && <section><h2 className="text-lg font-semibold text-slate-200 mb-3">Next Steps</h2><div className="space-y-2">{nextSteps.map((p) => <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 hover:bg-slate-800 transition-colors"><div className="flex items-center justify-between gap-2"><span className="font-medium text-slate-200">{p.name}</span><div className="flex items-center gap-2 shrink-0"><StatusBadge status={p.status} /><Stale updatedAt={p.updatedAt} /></div></div><p className="mt-1 text-sm text-slate-400">{p.nextStep}</p></button>)}</div></section>}

      {inProgress.length > 0 && <section><h2 className="text-lg font-semibold text-blue-400 mb-3">Currently In Progress</h2><div className="space-y-2">{inProgress.map((t) => <button key={t.id} onClick={() => onSelect(t.pId)} className="w-full text-left rounded-lg bg-blue-950/20 border border-blue-900/30 p-3 hover:bg-blue-950/40 transition-colors"><span className="text-sm text-slate-400">{t.pName}</span><p className="font-medium text-slate-200">{t.title}</p></button>)}</div></section>}

      {projects.length === 0 && <div className="text-center py-16 text-slate-500"><p className="text-lg">No projects yet</p><p className="mt-1 text-sm">Add your first project to get started</p></div>}
    </div>
  );
}

/* ─── project list ───────────────────────────────────────── */
function ProjList({ projects, onSelect }) {
  return (
    <div className="space-y-3">
      {projects.map((p) => {
        const done = p.tasks.filter((t) => t.status === "done").length;
        const total = p.tasks.length;
        return (
          <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 hover:bg-slate-800 transition-colors group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-200 group-hover:text-white truncate">{p.name || "Untitled Project"}</h3>
                {p.description && <p className="mt-1 text-sm text-slate-400 line-clamp-2">{p.description}</p>}
                {p.nextStep && <p className="mt-2 text-sm text-slate-500"><span className="text-slate-400 font-medium">Next:</span> {p.nextStep}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge status={p.status} /><DeployBadge netlify={p.netlify} /><GitHubBadge github={p.github} /><Stale updatedAt={p.updatedAt} />
                {total > 0 && <span className="text-xs text-slate-500">{done}/{total} tasks</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── editable field ────────────────────────────────────── */
function Editable({ field, label, value, multi, editing, tempValue, onTempChange, onStartEdit, onCommit, onKeyDown, inputRef }) {
  const Tag = multi ? "textarea" : "input";
  return (
    <div className="group">
      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      {editing ? <Tag ref={inputRef} type="text" value={tempValue} onChange={(e) => onTempChange(e.target.value)} onKeyDown={(e) => onKeyDown(e, field)} onBlur={() => onCommit(field)} rows={multi ? 3 : undefined} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        : <button onClick={() => onStartEdit(field, value)} className="w-full text-left px-3 py-2 rounded-lg border border-transparent hover:border-slate-600 hover:bg-slate-800/50 transition-colors min-h-[2.5rem] flex items-start"><span className={`text-sm ${value ? "text-slate-200" : "text-slate-500 italic"}`}>{value || `Set ${label.toLowerCase()}…`}</span><span className="ml-auto opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity shrink-0 mt-0.5"><IconEdit size={14} /></span></button>}
    </div>
  );
}

/* ─── project detail ─────────────────────────────────────── */
function Detail({ project, actions, todos, onUpdateTodo, onDeleteTodo, onBack }) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [newTask, setNewTask] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showNetlify, setShowNetlify] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [syncingNetlify, setSyncingNetlify] = useState(false);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const ref = useRef(null);

  useEffect(() => { if (editingField && ref.current) ref.current.focus(); }, [editingField]);

  const startEdit = (f, v) => { setEditingField(f); setTempValue(v || ""); };
  const commitEdit = (f) => { actions.updateProject(project.id, { [f]: tempValue }); setEditingField(null); };
  const onKey = (e, f) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(f); } if (e.key === "Escape") setEditingField(null); };

  const handleAddTask = () => { if (!newTask.trim()) return; actions.addTask(project.id, newTask.trim()); setNewTask(""); };
  const handleSyncNetlify = async () => { setSyncingNetlify(true); await actions.syncNetlifyDeploys(); setSyncingNetlify(false); };
  const handleSyncGithub = async () => { setSyncingGithub(true); await actions.syncGithubActivity(); setSyncingGithub(false); };

  const groups = { in_progress: project.tasks.filter((t) => t.status === "in_progress"), todo: project.tasks.filter((t) => t.status === "todo"), blocked: project.tasks.filter((t) => t.status === "blocked"), done: project.tasks.filter((t) => t.status === "done") };
  const gc = { in_progress: "border-blue-900/30", todo: "border-slate-700/50", blocked: "border-red-900/30", done: "border-slate-700/30" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200" aria-label="Back to overview"><IconBack /></button>
        <div className="flex-1 min-w-0">
          {editingField === "name" ? <input ref={ref} type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value)} onKeyDown={(e) => onKey(e, "name")} onBlur={() => commitEdit("name")} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            : <button onClick={() => startEdit("name", project.name)} className="text-left group flex items-center gap-2"><h2 className="text-xl font-bold text-slate-200 truncate">{project.name || "Untitled Project"}</h2><span className="opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity"><IconEdit size={14} /></span></button>}
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-5 space-y-4">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Status</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project status">
            {Object.entries(STATUS).map(([k, v]) => <button key={k} onClick={() => actions.updateProject(project.id, { status: k })} role="radio" aria-checked={project.status === k} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${project.status === k ? `${v.color} text-white` : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"}`}>{v.label}</button>)}
          </div>
        </div>
        <Editable field="description" label="Description" value={project.description} multi editing={editingField === "description"} tempValue={tempValue} onTempChange={setTempValue} onStartEdit={startEdit} onCommit={commitEdit} onKeyDown={onKey} inputRef={ref} />
        <div className="rounded-lg bg-slate-900/50 border border-blue-900/30 p-4">
          <Editable field="nextStep" label="⚡ Next Step" value={project.nextStep} editing={editingField === "nextStep"} tempValue={tempValue} onTempChange={setTempValue} onStartEdit={startEdit} onCommit={commitEdit} onKeyDown={onKey} inputRef={ref} />
          <p className="text-xs text-slate-500 mt-1 px-3">What should you do when you next sit down with this project?</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-500 px-3"><span>Created {fmtDate(project.createdAt)}</span><span>Updated {fmtDate(project.updatedAt)}</span></div>
      </div>

      <DeployCard netlify={project.netlify} onEdit={() => setShowNetlify(true)} onRemove={() => actions.removeNetlifySite(project.id)} onSync={handleSyncNetlify} syncing={syncingNetlify} />

      <GitHubCard github={project.github} onEdit={() => setShowGithub(true)} onRemove={() => actions.removeGithubRepo(project.id)} onSync={handleSyncGithub} syncing={syncingGithub} />

      <section>
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Tasks</h3>
        <div className="flex gap-2 mb-4">
          <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }} placeholder="Add a task…" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleAddTask} disabled={!newTask.trim()} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"><IconPlus size={18} /></button>
        </div>
        {Object.entries(groups).map(([s, tasks]) => {
          if (!tasks.length) return null;
          return <div key={s} className="mb-4"><h4 className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">{TASK_STATUS[s]} <span className="text-slate-500">({tasks.length})</span></h4><div className="space-y-1">{tasks.map((t) => <div key={t.id} className={`flex items-center gap-3 rounded-lg bg-slate-800/40 border ${gc[s]} p-3 group`}>{s === "done" ? <span className="text-emerald-500 shrink-0"><IconCheck /></span> : <span className="w-4 shrink-0" />}<span className={`flex-1 text-sm ${s === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>{t.title}</span><select value={t.status} onChange={(e) => actions.updateTask(project.id, t.id, { status: e.target.value })} aria-label={`Status for ${t.title}`} className="bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 px-2 py-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer">{Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><button onClick={() => actions.deleteTask(project.id, t.id)} aria-label={`Delete ${t.title}`} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0"><IconTrash size={14} /></button></div>)}</div></div>;
        })}
        {project.tasks.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No tasks yet — add one above</p>}
      </section>

      {todos?.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">TODOs</h3>
          <div className="space-y-3">
            {todos.map((todo) => (
              <TodoCard key={todo.id} todo={todo} onUpdate={onUpdateTodo} onDelete={onDeleteTodo} />
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-slate-800 pt-6">
        {showDelete ? <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/40 rounded-lg p-4"><p className="text-sm text-red-300 flex-1">Permanently delete "{project.name || "this project"}"?</p><button onClick={() => { actions.deleteProject(project.id); onBack(); }} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium text-white transition-colors">Delete</button><button onClick={() => setShowDelete(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">Cancel</button></div>
          : <button onClick={() => setShowDelete(true)} className="text-sm text-slate-500 hover:text-red-400 transition-colors">Delete project</button>}
      </div>

      {showNetlify && <NetlifyModal netlify={project.netlify} onSave={(data) => { actions.saveNetlifySite(project.id, data); setShowNetlify(false); }} onClose={() => setShowNetlify(false)} />}
      {showGithub && <GitHubModal github={project.github} onSave={(data) => { actions.saveGithubRepo(project.id, data); setShowGithub(false); }} onClose={() => setShowGithub(false)} />}
    </div>
  );
}

/* ─── app shell ──────────────────────────────────────────── */
export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const {
    projects, loading: projLoading,
    createProject, updateProject, deleteProject,
    addTask, updateTask, deleteTask,
    saveNetlifySite, removeNetlifySite,
    saveGithubRepo, removeGithubRepo,
    syncNetlifyDeploys, syncGithubActivity,
  } = useProjects(user?.id);
  const { saveTokens } = useSettings(user?.id);
  const {
    todos, createTodo, updateTodo, deleteTodo,
  } = useTodos(user?.id);

  const [view, setView] = useState("overview");
  const [selectedId, setSelectedId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const select = (id) => { setSelectedId(id); setView("detail"); };
  const selected = projects.find((p) => p.id === selectedId);
  const handleNew = async () => { const p = await createProject(); if (p) { setSelectedId(p.id); setView("detail"); } };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading…</div></div>;
  }

  if (!user) {
    return <LoginScreen onSignIn={signInWithGoogle} loading={authLoading} mode={import.meta.env.VITE_PULSE_MODE ?? "single"} />;
  }

  if (projLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading projects…</div></div>;
  }

  const actions = { updateProject, deleteProject, addTask, updateTask, deleteTask, saveNetlifySite, removeNetlifySite, saveGithubRepo, removeGithubRepo, syncNetlifyDeploys, syncGithubActivity };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* top bar */}
        {view !== "detail" && (
          <div className="flex items-center justify-between mb-6">
            <nav className="flex items-center gap-1 flex-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
              {[
                ["overview", "Overview"],
                ["projects", `Projects (${projects.length})`],
                ["todos", "TODOs"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    view === v
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button onClick={handleNew} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5" aria-label="Add new project"><IconPlus size={16} /><span className="hidden sm:inline">New</span></button>
            </nav>
            <button onClick={() => setShowSettings(true)} className="ml-3 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors" aria-label="Settings" title="Settings"><IconSettings size={18} /></button>
            <button onClick={signOut} className="ml-1 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors" aria-label="Sign out" title="Sign out"><IconLogout size={18} /></button>
          </div>
        )}

        {view === "overview" && <Overview projects={projects} onSelect={select} />}

        {view === "projects" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-4">All Projects</h1>
            <ProjList projects={projects} onSelect={select} />
            {projects.length === 0 && <div className="text-center py-16"><p className="text-slate-500">No projects yet</p><button onClick={handleNew} className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors">Add your first project</button></div>}
          </div>
        )}

        {view === "todos" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-100">TODOs</h1>
            <TodoForm onCreate={createTodo} projects={projects} />
            <TodoList todos={todos} onUpdate={updateTodo} onDelete={deleteTodo} projects={projects} />
          </div>
        )}

        {view === "detail" && selected && <Detail project={selected} actions={actions} todos={todos.filter((todo) => todo.projectId === selected.id)} onUpdateTodo={updateTodo} onDeleteTodo={deleteTodo} onBack={() => setView("overview")} />}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} saveTokens={saveTokens} />}
    </div>
  );
}
