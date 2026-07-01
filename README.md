# DAR Tracker

A personal tool for logging daily tasks and generating the Daily Activities Report
(DAR) format for Slack, with optional import from Clockify.

## What's in here

- `index.html` — the whole app. Single file, no build step, no dependencies.
  Open it directly in a browser or serve it statically.

## How it works

- **Storage:** tasks are saved in the browser's `localStorage`, keyed by date.
  Data lives in whichever browser you use it in — it won't follow you across
  devices, same as most local-first tools.
- **Clockify import:** pulls your time entries for a given day and lets you
  bring them in as tasks (individually, or merged into one — e.g. combining
  all your standups/meetings into a single "Meetings" entry).
- **Clockify proxy:** Clockify's API blocks direct browser requests (CORS),
  so API calls route through a small proxy instead of hitting Clockify
  directly. That proxy is a separate service — see below.

## Running it locally

No build step needed. Either:

- Open `index.html` directly in your browser, or
- Serve it with any static server, e.g. `npx serve .` or Python's
  `python3 -m http.server`

## Deploying

**GitHub Pages (simplest, free):**
1. Push this repo to GitHub
2. Repo Settings → Pages → Deploy from branch → select `main` → root
3. GitHub gives you a URL like `https://yourname.github.io/dar-tracker/`

**Vercel / Netlify (auto-deploy on every push):**
1. Import the repo on vercel.com or netlify.com
2. No build command needed — it's a static site
3. Every `git push` triggers a redeploy automatically

## The Clockify proxy

Clockify's API doesn't allow direct browser calls to `api.clockify.me` from
another origin, so this app optionally routes requests through a proxy you
control. That proxy currently lives on Val.town as a separate small service
(see `proxy/dar-tracker-server.val.ts` if included, or your existing deployed
val). It just forwards requests to Clockify server-to-server and adds the
CORS headers browsers require.

To use it: open the app → Import from Clockify → API key tab → paste your
Clockify API key and the proxy's URL. Both are stored in your browser only.

If you ever want to move the proxy itself into this repo (e.g. as a Vercel
Edge Function or Cloudflare Worker) instead of Val.town, that's a clean
follow-up — ask your editor's AI to scaffold the equivalent for whichever
platform you deploy the main app to, so everything lives in one place.

## Editing this with AI in your editor

This file is intentionally a single HTML file with inline CSS/JS, which
keeps it easy for an AI pairing tool (Cursor, Claude Code, Copilot) to
reason about the whole app in one context window. If it grows past a
few thousand lines, that's a natural point to split into separate
CSS/JS files or introduce a build step — not before.
