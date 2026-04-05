import { describe, it, expect, vi, afterEach } from "vitest";
import { daysSince, fmtDate, fmtDuration, timeAgo } from "./helpers";

describe("daysSince", () => {
  afterEach(() => vi.useRealTimers());

  it("returns null for falsy input", () => {
    expect(daysSince(null)).toBeNull();
    expect(daysSince(undefined)).toBeNull();
    expect(daysSince("")).toBeNull();
  });

  it("returns 0 for today", () => {
    expect(daysSince(new Date().toISOString())).toBe(0);
  });

  it("returns correct number of days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T12:00:00Z"));

    expect(daysSince("2026-04-04T12:00:00Z")).toBe(1);
    expect(daysSince("2026-03-29T12:00:00Z")).toBe(7);
    expect(daysSince("2026-03-06T12:00:00Z")).toBe(30);
  });
});

describe("fmtDate", () => {
  it("returns empty string for falsy input", () => {
    expect(fmtDate(null)).toBe("");
    expect(fmtDate("")).toBe("");
  });

  it("formats a date in en-ZA locale", () => {
    const result = fmtDate("2026-01-15T00:00:00Z");
    // en-ZA: "15 Jan 2026"
    expect(result).toContain("Jan");
    expect(result).toContain("2026");
  });
});

describe("fmtDuration", () => {
  it("returns empty string for falsy input", () => {
    expect(fmtDuration(0)).toBe("");
    expect(fmtDuration(null)).toBe("");
    expect(fmtDuration(undefined)).toBe("");
  });

  it("formats seconds only", () => {
    expect(fmtDuration(30)).toBe("30s");
    expect(fmtDuration(59)).toBe("59s");
  });

  it("formats minutes only", () => {
    expect(fmtDuration(60)).toBe("1m");
    expect(fmtDuration(120)).toBe("2m");
  });

  it("formats minutes and seconds", () => {
    expect(fmtDuration(90)).toBe("1m 30s");
    expect(fmtDuration(150)).toBe("2m 30s");
  });
});

describe("timeAgo", () => {
  afterEach(() => vi.useRealTimers());

  it("returns empty string for falsy input", () => {
    expect(timeAgo(null)).toBe("");
    expect(timeAgo("")).toBe("");
  });

  it('returns "just now" for less than 60 seconds', () => {
    const now = new Date();
    expect(timeAgo(now.toISOString())).toBe("just now");
  });

  it("returns minutes ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T12:05:00Z"));
    expect(timeAgo("2026-04-05T12:00:00Z")).toBe("5m ago");
  });

  it("returns hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T14:00:00Z"));
    expect(timeAgo("2026-04-05T12:00:00Z")).toBe("2h ago");
  });

  it('returns "yesterday" for 1 day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T12:00:00Z"));
    expect(timeAgo("2026-04-04T12:00:00Z")).toBe("yesterday");
  });

  it("returns days ago for multiple days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T12:00:00Z"));
    expect(timeAgo("2026-04-02T12:00:00Z")).toBe("3d ago");
  });
});
