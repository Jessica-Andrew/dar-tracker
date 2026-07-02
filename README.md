# DAR Tracker

A personal daily task tracker that generates the Daily Activities Report
format for Slack, with optional Clockify import. Works across laptop,
iPad, and iPhone once signed in.

## Stack

- **Frontend** — React + Vite + TypeScript + Tailwind + Radix + shadcn-style primitives
- **Backend** — Supabase (Postgres + Auth via GitHub OAuth)
- **Clockify proxy** — Val.town, holds the Clockify API key server-side

See `ARCHITECTURE.md` for the full system design and `DESIGN_TOKENS.md`
for the visual system.

## Getting started

### 1. Install
```bash
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the migration from `supabase/migrations/0001_initial_schema.sql`
3. Auth → Providers → enable GitHub, add a GitHub OAuth app
   (its callback URL is `<your-supabase-url>/auth/v1/callback`)
4. Copy your project URL and anon key into `.env.local`

### 3. Set up the Val.town proxy
1. In [val.town](https://val.town), create a new HTTP val
2. Paste in `proxy/dar-tracker-server.val.ts`
3. Add two environment variables on the val:
   - `CLOCKIFY_API_KEY` — your Clockify API key
   - `SUPABASE_JWT_SECRET` — Supabase → Project Settings → API → JWT Secret
4. Copy the val's URL into `.env.local` as `VITE_CLOCKIFY_PROXY_URL`

### 4. Run
```bash
cp .env.example .env.local  # fill in the values
npm run dev
```

## Deploying

Push to `main` on GitHub → import the repo in Vercel → add the same three
env vars in Vercel project settings. Every push to `main` auto-deploys.

## Project structure

```
src/
├── App.tsx                     — auth gate + shell switch
├── main.tsx                    — React entry
├── styles/
│   ├── tokens.css              — design tokens (source of truth)
│   └── globals.css             — Tailwind layers + base
├── components/
│   ├── AuthGate.tsx            — sign-in screen
│   ├── AppShell.tsx            — signed-in layout, date state
│   ├── DayView.tsx             — the main daily surface
│   ├── EmptyDay.tsx            — "quiet morning" empty state
│   ├── TaskList.tsx            — list of tasks with seed markers
│   ├── TaskForm.tsx            — add/edit modal
│   ├── ClockifyImportPanel.tsx — fetch + merge + plant
│   ├── SlackPreview.tsx        — DAR-formatted output + copy
│   └── ui/                     — primitives (Button, Modal, Input, etc.)
└── lib/
    ├── supabase.ts             — Supabase client
    ├── clockify.ts             — Clockify proxy client
    ├── duration.ts             — hours ↔ seconds ↔ "1h 42m"
    ├── utils.ts                — cn (Tailwind merge)
    ├── database.types.ts       — Supabase table types
    └── hooks/
        ├── useAuth.ts
        ├── useDayTasks.ts
        └── useClockifyConfig.ts

supabase/migrations/            — SQL schema
proxy/                          — Val.town proxy source
design/                         — reference designs
```

## Working on this with AI

The repo is structured so any AI editor (Cursor, Claude Code, Copilot) has
the context it needs:

- **`ARCHITECTURE.md`** — how the pieces fit together, data model, security
- **`DESIGN_TOKENS.md`** — usage guide for every design token
- **`design/day-view-reference.png`** — the canonical visual reference
- **`src/lib/`** — clean seams; Cursor can extend hooks or add utilities
  without touching UI
- **`src/components/ui/`** — primitives to compose from, not to duplicate
