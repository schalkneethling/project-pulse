export const STATUS = {
  active: { label: "Active", color: "bg-emerald-500", text: "text-emerald-400" },
  paused: { label: "Paused", color: "bg-amber-500", text: "text-amber-400" },
  blocked: { label: "Blocked", color: "bg-red-500", text: "text-red-400" },
  done: { label: "Done", color: "bg-slate-500", text: "text-slate-400" },
};

export const TASK_STATUS = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

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
  todos: "follow-ups",
};
