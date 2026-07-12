import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/014_focus_mode_github_tasks.sql"), "utf8");
const syncFunction = readFileSync(join(process.cwd(), "netlify/functions/sync-github-issues.mjs"), "utf8");
const completeFunction = readFileSync(join(process.cwd(), "netlify/functions/complete-github-task.mjs"), "utf8");

describe("GitHub-backed task implementation", () => {
  it("adds task descriptions, provenance, and an idempotency index", () => {
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS description text/i);
    expect(migration).toMatch(/github_issue_id bigint/i);
    expect(migration).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_github_issue/i);
  });

  it("imports only open issues and excludes pull requests", () => {
    expect(syncFunction).toMatch(/state=open/);
    expect(syncFunction).toMatch(/filter\(\(issue\) => !issue\.pull_request\)/);
    expect(syncFunction).toMatch(/github_completed_by_sync: true/);
  });

  it("closes GitHub before completing the local task", () => {
    const closeCall = completeFunction.search(/body:\s*JSON\.stringify\(\{\s*state:\s*"closed"\s*\}\)/);
    const localUpdate = completeFunction.search(/\.update\(\{\s*status:\s*"done"/);
    expect(closeCall).toBeGreaterThan(-1);
    expect(localUpdate).toBeGreaterThan(closeCall);
  });
});
