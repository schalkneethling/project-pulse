# Project Pulse ⚡

Track your side projects. See what needs you.

A personal project dashboard that answers: "What should I be working on, and where did I leave off?" Built with React, Tailwind CSS, and Supabase.

## Features

- **Overview dashboard** — aggregates everything blocked on you, in-progress tasks, next steps, and deploy alerts across all projects
- **Per-project detail** — status, description, next step, task list with statuses (todo/in-progress/blocked/done)
- **Netlify deploy status** — link a Netlify site to any project and track deploy state, branch, commit, build time, and errors
- **Google auth** — sign in with Google via Supabase Auth, your data is private to you
- **Staleness detection** — projects with no activity in 7+ days get flagged automatically

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from **Project Settings > API**

### 2. Run the database migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Paste the contents of `supabase/001_initial_schema.sql` and run it
3. This creates all tables, indexes, RLS policies, and triggers

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

### 5. Deploy to Cloudflare Pages

```bash
# Build the production bundle
npm run build

# The output is in dist/
```

In the Cloudflare dashboard:

1. Go to **Workers & Pages > Create application > Pages**
2. Connect your Git repo, or upload the `dist/` folder directly
3. Set build command: `npm run build`
4. Set build output directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Update your Supabase **Site URL** and **Redirect URLs** under **Authentication > URL Configuration** to include your Cloudflare Pages domain

## Project structure

```
project-pulse/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example
├── supabase/
│   └── 001_initial_schema.sql    # Database schema, RLS, triggers
└── src/
    ├── main.jsx                  # Entry point
    ├── index.css                 # Tailwind imports
    ├── App.jsx                   # Main app (views + UI components)
    ├── lib/
    │   └── supabase.js           # Supabase client init
    ├── hooks/
    │   ├── useAuth.js            # Auth state, Google sign-in/out
    │   └── useProjects.js        # All CRUD: projects, tasks, netlify
    └── components/
        └── LoginScreen.jsx       # Google sign-in screen
```

## Database schema

- **projects** — name, description, status, next_step, timestamps
- **tasks** — title, status, linked to project
- **netlify_sites** — site name, URL, Netlify site ID, linked to project (1:1)
- **netlify_deploys** — state, branch, commit, build time, errors, linked to site
- **user_settings** — Netlify API token (for future auto-sync)

All tables have Row Level Security — users can only access their own data.

## Roadmap

- [ ] Netlify API auto-sync (poll deploy status using stored API token)
- [ ] GitHub integration (PRs to review, assigned issues, commit activity)
- [ ] Drag-and-drop project reordering
- [ ] Project categories/tags
- [ ] Supabase Realtime for live deploy webhook updates
- [ ] Export/import projects as JSON
