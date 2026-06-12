const URL_RE = /https?:\/\/[^\s]+/g;

/** Returns a normalized http(s) URL, or null if the value is missing or unsafe. */
export function safeHttpUrl(raw) {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Splits a string into text and link segments.
 * Returns an array of { type: "text" | "link", value: string, start: number }
 * where `start` is the segment's offset within the input — useful as a stable
 * React `key` since the offset is unique per segment, even when two segments
 * share the same text.
 */
export function linkify(text) {
  if (!text) {
    return [];
  }

  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
        start: lastIndex,
      });
    }
    segments.push({ type: "link", value: match[0], start: match.index });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex), start: lastIndex });
  }

  return segments;
}
