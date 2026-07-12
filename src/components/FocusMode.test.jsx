import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FocusMode } from "./FocusMode";

describe("FocusMode", () => {
  beforeEach(() => {
    class Instant {
      constructor(ms) { this.ms = ms; }
      toString() { return String(this.ms); }
      since(other) { return { total: () => this.ms - other.ms }; }
      static from(value) { return new Instant(Number(value)); }
    }
    globalThis.Temporal = { Instant, Now: { instant: () => new Instant(10_000) } };
  });

  afterEach(() => delete globalThis.Temporal);

  it("offers only pause/resume and completion actions", () => {
    render(
      <FocusMode
        session={{ running: true, anchor: "10000", accumulatedMs: 0 }}
        task={{ title: "Ship focus mode", description: "Stay with the next action." }}
        projectName="Pulse"
        onSessionChange={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((button) => button.textContent.trim())).toEqual([
      "Pause",
      "Mark complete",
    ]);
  });

  it("pauses with the accumulated Temporal duration", async () => {
    const onSessionChange = vi.fn();
    render(
      <FocusMode
        session={{ running: true, anchor: "5000", accumulatedMs: 1_000 }}
        task={{ title: "Test timer", description: "" }}
        onSessionChange={onSessionChange}
        onComplete={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onSessionChange).toHaveBeenCalledWith(expect.objectContaining({
      running: false,
      anchor: null,
      accumulatedMs: 6_000,
    }));
  });
});
