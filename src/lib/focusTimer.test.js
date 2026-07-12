import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FOCUS_STORAGE_KEY,
  currentElapsedMs,
  formatFocusElapsed,
  readFocusSession,
  writeFocusSession,
} from "./focusTimer";

function installTemporal(nowMs = 0) {
  class FakeInstant {
    constructor(ms) { this.ms = ms; }
    toString() { return String(this.ms); }
    since(other) { return { total: () => this.ms - other.ms }; }
    static from(value) {
      const ms = Number(value);
      if (!Number.isFinite(ms)) throw new RangeError("Invalid instant");
      return new FakeInstant(ms);
    }
  }
  globalThis.Temporal = {
    Instant: FakeInstant,
    Now: { instant: vi.fn(() => new FakeInstant(nowMs)) },
  };
}

describe("focusTimer", () => {
  beforeEach(() => {
    localStorage.clear();
    installTemporal(12_400);
  });

  afterEach(() => {
    delete globalThis.Temporal;
  });

  it("derives running elapsed time from a Temporal anchor", () => {
    expect(currentElapsedMs({ running: true, anchor: "10000", accumulatedMs: 500 })).toBe(2_900);
  });

  it("rounds display down to five-second increments", () => {
    expect(formatFocusElapsed(4_999)).toBe("00:00:00");
    expect(formatFocusElapsed(65_999)).toBe("00:01:05");
    expect(formatFocusElapsed(3_661_000)).toBe("01:01:00");
  });

  it("round-trips a persisted focus session", () => {
    const session = { projectId: "p1", taskId: "t1", running: true, anchor: "10000", accumulatedMs: 20 };
    writeFocusSession(session);
    expect(readFocusSession()).toEqual(session);
  });

  it("clears malformed persisted state", () => {
    localStorage.setItem(FOCUS_STORAGE_KEY, "not-json");
    expect(readFocusSession()).toBeNull();
    expect(localStorage.getItem(FOCUS_STORAGE_KEY)).toBeNull();
  });
});
