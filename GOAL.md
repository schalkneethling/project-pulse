# Project Goal

## North Star

Project Pulse helps one person keep many side projects moving by showing what needs attention, where they left off, and which external signals are blocking progress.

## Who This Is For

The primary audience is a solo maker who maintains multiple personal or open source projects and wants a private dashboard for project state, next actions, deploy health, and GitHub activity.

## Core Goals

1. Make attention obvious.
   - Surface blocked projects and work items, active work, due-soon items, stale projects, failed or in-progress deploys, review requests, and assigned GitHub issues.

2. Preserve project context.
   - Store each project's status, description, next step, work items, source links, due dates, archive state, and integration links so it is easy to resume work after time away.

3. Connect to the tools that already produce signals.
   - Pull Netlify deploy state and GitHub activity into the dashboard without requiring users to manually inspect each project elsewhere.

4. Keep personal data private and scoped.
   - Use Supabase Auth and row-level security so each user only sees their own data, and keep sensitive integration tokens out of the client-readable surface.

5. Stay simple enough for repeated use.
   - Favor fast triage, concise project details, and low-friction updates over broad project management ceremony.

## Success Looks Like

- Opening the dashboard quickly answers: "What should I work on next?"
- A stale or blocked side project can be resumed without reconstructing context from memory.
- Netlify and GitHub signals are accurate enough to prevent missed deploy failures, pending reviews, and assigned issues.
- Work item changes, integration syncs, and realtime updates feel reliable in normal use.
- The app remains understandable to set up, run locally, test, and deploy from the documented README path.

## Non-Goals

- Project Pulse is not a team project management platform, issue tracker, sprint planner, CRM, or reporting suite.
- It should not replace GitHub, Netlify, or Supabase dashboards; it should summarize the parts of those systems that affect personal project attention.
- It should not optimize for collaboration, multi-tenant administration, organization-wide permissions, billing, or enterprise workflows.
- It should not accumulate generic productivity features unless they directly improve side-project triage and resumption.
- It should not expose integration secrets to the browser or trade away privacy for convenience.

## Principles and Constraints

- Privacy first: user data is scoped by authenticated user, and token presence may be exposed but token values must remain protected.
- Attention over inventory: the overview should prioritize actionable signals, not merely count stored projects.
- Integrations are summaries: external API sync should preserve useful snapshots while tolerating individual provider failures.
- Manual state still matters: users should be able to add and update projects and work items without relying on integrations.
- Setup should remain approachable for a small self-hosted or personal deployment using React, Supabase, and Netlify.
- Tests and CI should protect core behavior for routing, auth, project/work item logic, UI workflows, and production builds.

## Current Focus

- Maintain the core React dashboard, Supabase schema, and Netlify Functions that support project tracking, deploy sync, GitHub activity sync, and realtime activity updates.
- Improve ergonomics for organizing and resuming work, including roadmap items such as project reordering, categories or tags, and JSON import/export when they support the north star.
