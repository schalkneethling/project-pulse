const URL_RE = /https?:\/\/[^\s]+/g;

/**
 * Splits a string into text and link segments.
 * Returns an array of { type: "text" | "link", value: string }.
 */
export function linkify(text) {
  if (!text) return [];

  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "link", value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
