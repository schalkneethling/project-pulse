export const FOCUS_STORAGE_KEY = "pulse.focus-session.v1";

export function temporalAvailable() {
  return typeof globalThis.Temporal?.Now?.instant === "function";
}

export function currentElapsedMs(session, now = globalThis.Temporal?.Now?.instant()) {
  const accumulated = Math.max(0, Number(session?.accumulatedMs) || 0);
  if (!session?.running || !session.anchor || !now || !temporalAvailable()) return accumulated;
  const anchor = globalThis.Temporal.Instant.from(session.anchor);
  return accumulated + now.since(anchor).total({ unit: "milliseconds" });
}

export function formatFocusElapsed(milliseconds) {
  const roundedSeconds = Math.floor(Math.max(0, milliseconds) / 5000) * 5;
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function readFocusSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FOCUS_STORAGE_KEY));
    if (!parsed?.taskId || !parsed?.projectId || typeof parsed.running !== "boolean") return null;
    if (parsed.running && !parsed.anchor) return null;
    if (parsed.anchor && temporalAvailable()) globalThis.Temporal.Instant.from(parsed.anchor);
    return { ...parsed, accumulatedMs: Math.max(0, Number(parsed.accumulatedMs) || 0) };
  } catch {
    localStorage.removeItem(FOCUS_STORAGE_KEY);
    return null;
  }
}

export function writeFocusSession(session) {
  if (!session) localStorage.removeItem(FOCUS_STORAGE_KEY);
  else localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(session));
}
