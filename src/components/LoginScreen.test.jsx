import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  describe("multi-user mode", () => {
    it("renders the sign-in button", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={false} mode="multi" />);

      expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
    });

    it("shows 'Signing in…' when loading", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={true} mode="multi" />);

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it("disables the button when loading", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={true} mode="multi" />);

      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });

    it("calls onSignIn when clicked", async () => {
      const onSignIn = vi.fn();
      const user = userEvent.setup();
      render(<LoginScreen onSignIn={onSignIn} loading={false} mode="multi" />);

      await user.click(screen.getByRole("button", { name: /sign in with google/i }));

      expect(onSignIn).toHaveBeenCalledOnce();
    });

    it("displays the app title", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={false} mode="multi" />);

      expect(screen.getByText("Project Pulse")).toBeInTheDocument();
    });
  });

  describe("single-user mode", () => {
    it("shows personal instance message instead of sign-in button", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={false} mode="single" />);

      expect(screen.getByText(/personal project pulse instance/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /sign in with google/i }),
      ).not.toBeInTheDocument();
    });

    it("shows 'Sign in as owner' button", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={false} mode="single" />);

      expect(screen.getByRole("button", { name: /sign in as owner/i })).toBeInTheDocument();
    });

    it("includes a link to fork the project", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={false} mode="single" />);

      expect(screen.getByRole("link", { name: /fork it on github/i })).toHaveAttribute(
        "href",
        "https://github.com/schalkneethling/project-pulse",
      );
    });

    it("reveals sign-in button after clicking 'Sign in as owner'", async () => {
      const user = userEvent.setup();
      render(<LoginScreen onSignIn={vi.fn()} loading={false} mode="single" />);

      await user.click(screen.getByRole("button", { name: /sign in as owner/i }));

      expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
      expect(screen.queryByText(/personal project pulse instance/i)).not.toBeInTheDocument();
    });

    it("defaults to single-user mode when no mode is provided", () => {
      render(<LoginScreen onSignIn={vi.fn()} loading={false} />);

      expect(screen.getByText(/personal project pulse instance/i)).toBeInTheDocument();
    });
  });
});
