export const STATUS = {
  active: { label: "Active", color: "bg-emerald-500", text: "text-emerald-400" },
  paused: { label: "Paused", color: "bg-amber-500", text: "text-amber-400" },
  blocked: { label: "Blocked", color: "bg-red-500", text: "text-red-400" },
  done: { label: "Done", color: "bg-slate-500", text: "text-slate-400" },
};

export const WORK_STATUS = {
  todo: {
    label: "Next",
    pill: "bg-slate-500/20 text-slate-300",
    border: "border-slate-700/50",
    advance: "in_progress",
    advanceLabel: "Start",
  },
  in_progress: {
    label: "Active",
    pill: "bg-blue-500/20 text-blue-300",
    border: "border-blue-900/30",
    advance: "done",
    advanceLabel: "Complete",
  },
  blocked: {
    label: "Blocked",
    pill: "bg-red-500/20 text-red-300",
    border: "border-red-900/30",
    advance: "in_progress",
    advanceLabel: "Resume",
  },
  done: {
    label: "Done",
    pill: "bg-emerald-500/20 text-emerald-300",
    border: "border-slate-700/30",
    advance: null,
    advanceLabel: null,
  },
};

export const WORK_STATUS_ORDER = ["in_progress", "todo", "blocked", "done"];

/** @deprecated use WORK_STATUS */
export const TASK_STATUS = Object.fromEntries(
  Object.entries(WORK_STATUS).map(([k, v]) => [k, v.label]),
);

export const DEPLOY_STATUS = {
  ready: {
    label: "Published",
    color: "text-emerald-400",
    bg: "bg-emerald-950/30",
    border: "border-emerald-900/40",
    dot: "bg-emerald-500",
  },
  building: {
    label: "Building",
    color: "text-blue-400",
    bg: "bg-blue-950/30",
    border: "border-blue-900/40",
    dot: "bg-blue-500 animate-pulse",
  },
  enqueued: {
    label: "Queued",
    color: "text-amber-400",
    bg: "bg-amber-950/30",
    border: "border-amber-900/40",
    dot: "bg-amber-500",
  },
  error: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-950/30",
    border: "border-red-900/40",
    dot: "bg-red-500",
  },
  none: {
    label: "No deploys",
    color: "text-slate-500",
    bg: "bg-slate-800/40",
    border: "border-slate-700/50",
    dot: "bg-slate-600",
  },
};

export const RETURN_VIEW_LABELS = {
  overview: "overview",
  projects: "projects",
};
