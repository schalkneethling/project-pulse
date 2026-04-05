import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  it("renders the sign-in button", () => {
    render(<LoginScreen onSignIn={vi.fn()} loading={false} />);

    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument();
  });

  it("shows 'Signing in…' when loading", () => {
    render(<LoginScreen onSignIn={vi.fn()} loading={true} />);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it("disables the button when loading", () => {
    render(<LoginScreen onSignIn={vi.fn()} loading={true} />);

    expect(
      screen.getByRole("button", { name: /signing in/i })
    ).toBeDisabled();
  });

  it("calls onSignIn when clicked", async () => {
    const onSignIn = vi.fn();
    const user = userEvent.setup();
    render(<LoginScreen onSignIn={onSignIn} loading={false} />);

    await user.click(
      screen.getByRole("button", { name: /sign in with google/i })
    );

    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it("displays the app title", () => {
    render(<LoginScreen onSignIn={vi.fn()} loading={false} />);

    expect(screen.getByText("Project Pulse")).toBeInTheDocument();
  });
});
