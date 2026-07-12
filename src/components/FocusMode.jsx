import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { currentElapsedMs, formatFocusElapsed, temporalAvailable } from "../lib/focusTimer";
import { IconCheck } from "./icons";

function Jellyfish({ className }) {
  return (
    <svg className={`focus-jelly ${className}`} viewBox="0 0 220 280" aria-hidden="true">
      <defs>
        <linearGradient id={`jelly-${className}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#38bdf8" stopOpacity=".32" />
          <stop offset="1" stopColor="#818cf8" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <path fill={`url(#jelly-${className})`} d="M25 105C25 47 62 15 110 15s85 32 85 90c0 20-7 37-20 48-16 13-34-4-48 8-11 9-24 9-34 0-15-13-34 5-50-9-12-11-18-27-18-47Z" />
      <path className="focus-tentacle" d="M62 145c-20 38 18 50-5 91M96 151c-13 44 17 54-1 105M132 151c16 42-13 55 6 101M164 143c25 36-13 52 12 91" />
    </svg>
  );
}

export function FocusMode({ session, task, projectName, onSessionChange, onComplete }) {
  const containerRef = useRef(null);
  const [elapsed, setElapsed] = useState(() => currentElapsedMs(session));
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  useFocusTrap(containerRef);

  useEffect(() => {
    document.body.classList.add("focus-mode-open");
    return () => document.body.classList.remove("focus-mode-open");
  }, []);

  useEffect(() => {
    setElapsed(currentElapsedMs(session));
    if (!session.running || !temporalAvailable()) return undefined;
    const interval = window.setInterval(() => setElapsed(currentElapsedMs(session)), 250);
    return () => window.clearInterval(interval);
  }, [session]);

  const togglePause = () => {
    if (!temporalAvailable()) return;
    if (session.running) {
      const accumulatedMs = currentElapsedMs(session);
      setElapsed(accumulatedMs);
      onSessionChange({ ...session, running: false, anchor: null, accumulatedMs });
    } else {
      onSessionChange({ ...session, running: true, anchor: globalThis.Temporal.Now.instant().toString() });
    }
  };

  const complete = async () => {
    if (completing) return;
    setCompleting(true);
    setError(null);
    try {
      await onComplete();
    } catch (err) {
      setError(err?.message || "Could not complete this task.");
      setCompleting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-task-title"
      aria-describedby={task.description ? "focus-task-description" : undefined}
      className={`focus-mode fixed inset-0 z-[100] overflow-hidden bg-slate-900 ${session.running ? "is-running" : "is-paused"}`}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Jellyfish className="jelly-one" />
        <Jellyfish className="jelly-two" />
        <Jellyfish className="jelly-three" />
      </div>

      <main className="relative z-10 flex min-h-full items-center justify-center px-6 py-10">
        <div className="w-full max-w-3xl text-center">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.28em] text-sky-300/70">
            {projectName || "Focused work"}
          </p>
          <h1 id="focus-task-title" className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            {task.title}
          </h1>
          {task.description && (
            <p id="focus-task-description" className="mx-auto mt-5 max-w-2xl whitespace-pre-wrap text-base leading-7 text-slate-300/80 sm:text-lg">
              {task.description}
            </p>
          )}

          {temporalAvailable() ? (
            <p className="mt-12 font-mono text-5xl font-light tabular-nums tracking-[0.08em] text-slate-100 sm:text-7xl" role="timer" aria-live="off" aria-label={`${formatFocusElapsed(elapsed)} elapsed`}>
              {formatFocusElapsed(elapsed)}
            </p>
          ) : (
            <p role="alert" className="mx-auto mt-10 max-w-xl rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-amber-200">
              Focus mode requires a browser with the native Temporal API.
            </p>
          )}

          {temporalAvailable() && (
            <div className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <button autoFocus type="button" onClick={togglePause} disabled={completing} className="min-h-12 rounded-xl border border-slate-500/50 bg-slate-800/60 px-7 py-3 font-medium text-slate-100 backdrop-blur transition hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50">
                {session.running ? "Pause" : "Resume"}
              </button>
              <button type="button" onClick={complete} disabled={completing} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 font-medium text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60">
                <IconCheck size={18} />
                {completing ? "Completing…" : "Mark complete"}
              </button>
            </div>
          )}
          {error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}
          {!session.running && temporalAvailable() && <p className="mt-5 text-sm text-slate-500">Your place is held. Resume when you are ready.</p>}
        </div>
      </main>
    </div>
  );
}
