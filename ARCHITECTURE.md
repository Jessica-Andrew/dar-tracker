# Architecture

A single-user, cross-device task tracker that generates the Daily Activities
Report (DAR) format for Slack, with Clockify import as an optional shortcut.

Written down so any AI pairing tool (Cursor, Claude Code) has full context
when helping build — and so future-me remembers why things are the way they
are.

## Product goal

Log daily tasks (description, hours, links, blockers, next steps), generate
the DAR-formatted Slack message, and stop retyping what Clockify already
knows. Should work on laptop, iPad, and iPhone with data in sync.

## Non-goals (explicitly out of scope)

- Multi-user / team support
- Auto-posting to Slack (copy/paste is deliberate — one less integration)
- Historical analytics or trend charts
- Reminders / notifications
- Any real-time collaboration

If any of these need to come in later, they're additive — the architecture
below doesn't preclude them, but building for them now would add complexity
that isn't earning its keep.

## System diagram

```
┌─────────────────────────────────────────────┐
│   Your devices — laptop, iPad, iPhone       │
│  ┌───────────────────────────────────────┐  │
│  │  DAR Tracker frontend                 │  │
│  │  React + Vite + Tailwind + shadcn/ui  │  │
│  │  hosted on Vercel                     │  │
│  └───────────────────────────────────────┘  │
└───────────┬─────────────────────┬───────────┘
            │                     │
            ▼                     ▼
   ┌─────────────────┐   ┌──────────────────┐
   │    Supabase     │   │  Val.town proxy  │
   │                 │   │  (already live)  │
   │ · Auth (GitHub) │   └────────┬─────────┘
   │ · Postgres DB   │            │
   │ · Device sync   │            ▼
   └─────────────────┘   ┌──────────────────┐
                         │   Clockify API   │
                         │   (read only)    │
                         └──────────────────┘
```

## The four components

### 1. Frontend (this repo)

React + Vite + Tailwind + shadcn/ui. Single-page app, no server-side
rendering needed — this is a personal tool, not a public site with SEO
concerns.

Hosted on Vercel rather than GitHub Pages because Vercel handles the
Vite build automatically on push to `main`. Every commit deploys.

### 2. Supabase (backend-as-a-service)

Three responsibilities:

- **Auth** — GitHub OAuth. One-click sign-in, uses an account I already have.
- **Database** — Postgres, with row-level security policies so my rows are
  only visible to my logged-in session.
- **Sync** — because data lives on Supabase's servers rather than any one
  browser, iPad and laptop see the same tasks.

Free tier is generous enough for a personal single-user tool by a wide
margin.

### 3. Val.town proxy (already deployed)

Clockify's API doesn't send CORS headers permitting direct browser
requests, so calls route through this small forwarding proxy instead.
It just adds CORS headers and forwards to `api.clockify.me` server-to-
server.

The proxy holds no state and no secrets — the Clockify API key is
attached to each request client-side.

If it ever needs to move (e.g. consolidating into the frontend repo as
a Vercel Edge Function), that's a clean swap — nothing in the app knows
or cares where the proxy lives beyond its URL.

### 4. Clockify (external, read-only)

Time tracking stays where it is. This app only reads from Clockify;
it never writes back.

## Data model

Two tables in Supabase Postgres. Both use row-level security so a
`SELECT` only returns rows where `user_id = auth.uid()`.

### `tasks`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | FK to `auth.users`, RLS boundary |
| `date` | date | day this task belongs to (YYYY-MM-DD) |
| `description` | text | required |
| `hours` | numeric | decimal, stored precise; formatted for display |
| `task_label` | text | optional (e.g. `DS-014`) |
| `links` | text | free-form; may hold multiple URLs |
| `blockers` | text | free-form or empty |
| `next_steps` | text | free-form or empty |
| `source` | text | `manual` \| `clockify` \| `merged` |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger keeps this current |

Indexes: `(user_id, date)` — the only query pattern is "fetch this
user's tasks for this date."

### `clockify_config`

One row per user. Holds the Clockify API key, proxy URL, and cached
workspace/user IDs so we don't refetch them every day.

| Column | Type |
|---|---|
| `user_id` | uuid, primary key, FK to `auth.users` |
| `api_key` | text |
| `proxy_url` | text |
| `workspace_id` | text, nullable |
| `clockify_user_id` | text, nullable |
| `updated_at` | timestamptz |

### On storing the Clockify API key

Currently: kept in Supabase, encrypted at rest by Supabase but readable
by the frontend when the user is signed in. Fine for a personal tool,
but worth naming as a known trade-off:

- **Ideal:** the API key lives only on the proxy as an environment
  variable; the frontend never sees it. That means the proxy has to know
  which user is calling it (introduces auth on the proxy) and the app
  loses the "paste your own key" flexibility.
- **Current:** simpler, works, but the key is technically retrievable
  by anyone who compromises my Supabase session token.

For a single-user tool used from personal devices, the current approach
is a reasonable trade. Revisit if this ever becomes multi-user.

## Frontend structure

```
App
├── AuthGate                — GitHub login screen if signed out
├── AppShell                — header, date navigation, layout chrome
├── DayView                 — the main daily surface
│   ├── DailyTotal          — the big harvest numeral
│   ├── TaskList → TaskItem
│   └── TaskForm            — add / edit (modal or inline)
├── ClockifyImportPanel     — fetch, select, merge into tasks
└── SlackPreview            — formatted report + copy button
```

State management: React state + Supabase client (via `@supabase/supabase-js`).
No Redux or Zustand — the state surface is small enough that lifting to
context is fine.

Data hooks:
- `useAuth()` — current user, sign-in/out
- `useDayTasks(date)` — subscribe to a date's tasks, add/edit/delete
- `useClockifyConfig()` — read/write the proxy URL + API key
- `useClockifyImport(date)` — fetch a day's Clockify entries via proxy

## Environment variables

Frontend (`.env.local`, never committed):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.env.local` is gitignored. Vercel gets these via project settings.

The Clockify API key and proxy URL are **user-entered** in the app UI
and stored in Supabase — not env vars. This lets me change them without
redeploying, and keeps them out of the source tree.

## Deployment

- **Frontend** — `git push origin main` → Vercel auto-deploys.
- **Supabase** — schema is managed via SQL migrations in
  `supabase/migrations/` (created as the schema evolves), applied with
  `supabase db push`. RLS policies live in the same migrations.
- **Val.town proxy** — deployed once via the Val.town UI. If it needs an
  update, the source is at `proxy/dar-tracker-server.val.ts` — copy-paste
  into the val editor and save.

## Design system

Visual direction is warm/earthy/editorial — Fraunces serif for display
type, Space Grotesk for body, terracotta/ochre/olive palette on a warm
parchment background, organic "seed" shapes as task markers. See
`design/day-view-reference.png` for the canonical day view design.

Tokens (colors, type scale, spacing, radii) will be extracted into
`src/styles/tokens.css` and mirrored in the Tailwind config so the same
values are available whether you're writing CSS or utility classes.

Motion vocabulary: short (150–450ms), one consistent slightly-overshooting
spring curve (`cubic-bezier(.34, 1.56, .64, 1)`) for anything appearing
or reacting to touch, standard easing for utility fades. Every animation
is feedback for a user action, never decoration. Respect
`prefers-reduced-motion`.
