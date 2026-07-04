import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/012_service_dashboard.sql"),
  "utf8",
);

describe("service dashboard migration", () => {
  it("creates the generic service dashboard tables", () => {
    expect(migration).toMatch(/create table if not exists public\.service_connections/i);
    expect(migration).toMatch(/create table if not exists public\.service_resources/i);
    expect(migration).toMatch(/create table if not exists public\.service_snapshots/i);
    expect(migration).toMatch(/create table if not exists public\.service_alerts/i);
  });

  it("keeps provider secrets unreadable by authenticated browser clients", () => {
    expect(migration).toMatch(/revoke select \(secret_value\) on public\.service_connections from authenticated/i);
    expect(migration).toMatch(/has_secret\s+boolean not null default false/i);
    expect(migration).toMatch(/service_connections_sync_secret_flag/i);
  });

  it("enables RLS and realtime for user-visible dashboard data", () => {
    for (const table of [
      "service_connections",
      "service_resources",
      "service_snapshots",
      "service_alerts",
    ]) {
      expect(migration).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      );
    }

    expect(migration).toMatch(/alter publication supabase_realtime add table public\.service_snapshots/i);
    expect(migration).toMatch(/alter publication supabase_realtime add table public\.service_alerts/i);
  });
});
