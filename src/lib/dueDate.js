export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDueState(dueDate, status) {
  if (!dueDate || status === "done") {
    return null;
  }

  const todayKey = toDateKey(new Date());

  if (dueDate === todayKey) {
    return "today";
  }
  return dueDate < todayKey ? "late" : null;
}

export function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(navigator?.languages?.[0] ?? "en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isDueSoon(todo) {
  const state = getDueState(todo.dueDate, todo.status);
  return state === "today" || state === "late";
}
