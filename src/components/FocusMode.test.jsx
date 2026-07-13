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
        onExit={vi.fn()}
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
        onExit={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onSessionChange).toHaveBeenCalledWith(expect.objectContaining({
      running: false,
      anchor: null,
      accumulatedMs: 6_000,
    }));
  });

  it("resumes from the current accumulated duration", async () => {
    const onSessionChange = vi.fn();
    render(
      <FocusMode
        session={{ running: false, anchor: null, accumulatedMs: 6_000 }}
        task={{ title: "Resume timer", description: "" }}
        onSessionChange={onSessionChange}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(onSessionChange).toHaveBeenCalledWith(expect.objectContaining({
      running: true,
      anchor: "10000",
      accumulatedMs: 6_000,
    }));
  });

  it("runs completion and reports a retryable failure", async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error("GitHub refused the update"));
    const onExit = vi.fn();
    render(
      <FocusMode
        session={{ running: false, anchor: null, accumulatedMs: 0 }}
        task={{ title: "Close issue", description: "" }}
        onSessionChange={vi.fn()}
        onComplete={onComplete}
        onExit={onExit}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(await screen.findByRole("alert")).toHaveTextContent("GitHub refused the update");
    expect(screen.getByRole("button", { name: "Mark complete" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Exit focus" }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("runs successful completion without showing an error", async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(
      <FocusMode
        session={{ running: true, anchor: "10000", accumulatedMs: 0 }}
        task={{ title: "Finish work", description: "" }}
        onSessionChange={vi.fn()}
        onComplete={onComplete}
        onExit={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the unsupported-browser fallback without timer controls", () => {
    delete globalThis.Temporal;
    render(
      <FocusMode
        session={{ running: false, anchor: null, accumulatedMs: 0 }}
        task={{ title: "Unsupported timer", description: "" }}
        onSessionChange={vi.fn()}
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("native Temporal API");
    expect(screen.getByRole("button", { name: "Exit focus" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark complete" })).not.toBeInTheDocument();
  });
});
