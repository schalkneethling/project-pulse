# Project Pulse ⚡

Track your side projects. See what needs you.

A personal project dashboard that answers: "What should I be working on, and where did I leave off?" Built with React, Tailwind CSS, and Supabase.

## Features

- **Overview dashboard** — aggregates everything blocked on you, in-progress tasks, next steps, and deploy alerts across all projects
- **Per-project detail** — status, description, next step, task list with statuses (todo/in-progress/blocked/done)
- **Netlify deploy status** — link a Netlify site to any project and track deploy state, branch, commit, build time, and errors
- **GitHub activity** — open PRs, review requests, assigned issues, and latest commit per linked repo
- **Google auth** — sign in with Google via Supabase Auth, your data is private to you
- **Staleness detection** — projects with no activity in 7+ days get flagged automatically

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from **Project Settings > API**

### 2. Run the database migrations

In your Supabase dashboard, go to **SQL Editor** and run each migration file **in numeric order**:

1. `supabase/001_initial_schema.sql` — core tables, indexes, RLS policies, triggers
2. `supabase/002_github_integration.sql` — GitHub repos and activity tables
3. `supabase/003_single_user_mode.sql` — single-user mode support
4. `supabase/004_breadcrumbs.sql` — task metadata (who, source, source URL)
5. `supabase/005_github_total_issues.sql` — total open issues count
6. `supabase/006_todo_due_dates.sql` — due dates on tasks
7. `supabase/007_github_assigned_issue_details.sql` — assigned issue details JSON
8. `supabase/008_github_review_requested_pr_details.sql` — review-requested PR details JSON
9. `supabase/009_realtime_and_cron.sql` — Realtime publication, upsert constraints, token flags
10. `supabase/010_kanban_status.sql` — kanban status values
11. `supabase/011_work_items_merge.sql` — work item fields on tasks

Each file is idempotent where possible, but running them in order on a fresh database is the supported path.

### 3. Enable Google Auth

1. In your Supabase dashboard, go to **Authentication > Providers**
2. Enable **Google**
3. You'll need a Google OAuth client ID and secret:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create an OAuth 2.0 Client ID (Web application)
   - Add your Supabase auth callback URL as an authorized redirect URI:
     `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret into the Supabase Google provider settings
4. Add your site's URL to **Authentication > URL Configuration > Site URL** (e.g., `http://localhost:5173` for dev, or your production URL)

### 4. Install and run locally

```bash
# Clone and enter the project
cd project-pulse

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Start the dev server
npm run dev
```

Open http://localhost:5173 and sign in with Google.

For Netlify/GitHub sync buttons to work locally, run the Netlify dev server instead (see step 5).

### 5. Deploy to Netlify

The frontend calls Netlify Functions for Netlify deploy sync and GitHub activity sync (`/.netlify/functions/sync-netlify-deploys` and `/.netlify/functions/sync-github-activity`). Deploy to Netlify so those endpoints are available.

1. Connect your Git repo at [app.netlify.com](https://app.netlify.com)
2. Build settings (also defined in `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. Add environment variables under **Site settings > Environment variables**:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key
   - `SUPABASE_URL` — same Supabase project URL (used by functions)
   - `SUPABASE_SERVICE_KEY` — your Supabase service role key (functions only; never expose to the client)
4. Update your Supabase **Site URL** and **Redirect URLs** under **Authentication > URL Configuration** to include your Netlify domain

For local development with functions:

```bash
npm install -g netlify-cli   # if needed
netlify dev
```

## Project structure

```
project-pulse/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
├── .env.example
├── supabase/
│   ├── 001_initial_schema.sql
│   ├── 002_github_integration.sql
│   └── …                      # Run all migrations in order
├── netlify/
│   └── functions/
│       ├── sync-netlify-deploys.mjs
│       ├── sync-github-activity.mjs
│       └── sync-all.mjs         # Background sync (pg_cron)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── lib/
    │   ├── supabase.js
    │   └── linkify.js
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useProjects.js
    │   └── useSettings.js
    └── components/
        ├── Overview.jsx
        ├── ProjectList.jsx
        └── ProjectDetail/
```

## Database schema

- **projects** — name, description, status, next_step, archived_at, timestamps
- **tasks** — title, status, who, source, source_url, due_date, archived_at, linked to project
- **netlify_sites** — site name, URL, Netlify site ID, linked to project (1:1)
- **netlify_deploys** — state, branch, commit, build time, errors, linked to site
- **github_repos** — GitHub owner/repo, linked to project (1:1)
- **github_activity** — GitHub open PRs, review requests, assigned issues, latest commit, linked to repo
- **user_settings** — Netlify and GitHub API tokens (RLS-protected; presence exposed via boolean flags)

All tables have Row Level Security — users can only access their own data.

## Roadmap

- [x] Netlify API auto-sync (poll deploy status using stored API token)
- [x] GitHub integration (PRs to review, assigned issues, commit activity)
- [ ] Drag-and-drop project reordering
- [ ] Project categories/tags
- [x] Supabase Realtime for live deploy webhook updates
- [ ] Export/import projects as JSON
