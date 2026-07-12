import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/013_skip_unchanged_sync_writes.sql"),
  "utf8",
);

const writeHelper = readFileSync(
  join(process.cwd(), "netlify/functions/sync-snapshot-writes.mjs"),
  "utf8",
);

const syncAll = readFileSync(join(process.cwd(), "netlify/functions/sync-all.mjs"), "utf8");

describe("unchanged sync write suppression", () => {
  it("guards Netlify and GitHub upserts at the database layer", () => {
    expect(migration).toMatch(/create or replace function public\.upsert_netlify_deploy_if_changed/i);
    expect(migration).toMatch(/create or replace function public\.upsert_github_activity_if_changed/i);
    expect(migration.match(/on conflict \([^)]+\) do update/gi)).toHaveLength(2);
    expect(migration.match(/is distinct from/gi)).toHaveLength(2);
  });

  it("does not compare GitHub synced_at when deciding whether activity changed", () => {
    const compareStart = migration.indexOf("where (\n        github_activity.user_id");
    const compareEnd = migration.indexOf("returning 1", compareStart);
    const comparison = migration.slice(compareStart, compareEnd);

    expect(comparison).not.toMatch(/github_activity\.synced_at/);
    expect(comparison).not.toMatch(/excluded\.synced_at/);
  });

  it("limits guarded write RPCs to service role callers", () => {
    expect(migration).toMatch(/revoke execute on function public\.upsert_netlify_deploy_if_changed[\s\S]+from public, anon, authenticated/i);
    expect(migration).toMatch(/grant execute on function public\.upsert_netlify_deploy_if_changed[\s\S]+to service_role/i);
    expect(migration).toMatch(/revoke execute on function public\.upsert_github_activity_if_changed[\s\S]+from public, anon, authenticated/i);
    expect(migration).toMatch(/grant execute on function public\.upsert_github_activity_if_changed[\s\S]+to service_role/i);
  });

  it("routes sync functions through the guarded RPC helpers", () => {
    expect(writeHelper).toContain('rpc("upsert_netlify_deploy_if_changed"');
    expect(writeHelper).toContain('rpc("upsert_github_activity_if_changed"');
    expect(syncAll).toContain("writeNetlifyDeploySnapshot");
    expect(syncAll).toContain("writeGithubActivitySnapshot");
  });
});
