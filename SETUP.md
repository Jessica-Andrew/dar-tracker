# Setup guide — Phase 1

The build steps that happen outside your code editor: creating Supabase,
wiring GitHub OAuth, deploying the Val.town proxy. Follow this once,
top to bottom. Should take about 45 minutes.

Before starting, have these tabs open:
- [supabase.com](https://supabase.com)
- [github.com/settings/developers](https://github.com/settings/developers)
- [val.town](https://val.town) (already signed in from earlier)
- Your existing Clockify account (to grab the API key)

---

## 1.1 — Create Supabase project

1. Sign in at supabase.com with GitHub
2. Click **New project** → pick your personal org
3. Name it `dar-tracker`, pick a region close to you, generate a
   database password (save it in your password manager)
4. Wait ~2 minutes for the project to provision

While it's provisioning, keep the browser tab open — you'll need
several values from **Project Settings → API** in a moment.

---

## 1.2 — Run the SQL migration

1. Once the project is ready, open the **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase/migrations/0001_initial_schema.sql` from the repo
4. Paste the whole file into the SQL editor
5. Click **Run** (bottom-right)
6. You should see "Success. No rows returned"

To verify: go to **Table Editor** in the sidebar. You should see
`tasks` and `clockify_config` under the public schema, both empty.

---

## 1.3 — Enable GitHub OAuth in Supabase

1. In Supabase, go to **Authentication → Providers**
2. Find **GitHub**, click to expand
3. Toggle it **on**
4. Copy the **Callback URL** shown at the bottom — it looks like
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
5. Leave this tab open; you'll come back after setting up the GitHub
   OAuth app

---

## 1.4 — Create the GitHub OAuth app

1. Go to github.com/settings/developers
2. Click **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name**: DAR Tracker
   - **Homepage URL**: `http://localhost:5173` (Vite's default; you'll
     add the Vercel URL later)
   - **Authorization callback URL**: paste the Supabase callback URL
     from step 1.3
4. Click **Register application**
5. On the resulting page:
   - Copy the **Client ID**
   - Click **Generate a new client secret**, copy the secret
     immediately (you can't see it again after leaving this page)
6. Back in Supabase's GitHub provider settings, paste the Client ID
   and Client Secret into their fields
7. Click **Save**

---

## 1.5 — Copy Supabase credentials into .env.local

1. In the repo, run `cp .env.example .env.local` if you haven't already
2. In Supabase, go to **Project Settings → API**
3. Copy the **Project URL** (looks like `https://xxx.supabase.co`)
   into `VITE_SUPABASE_URL`
4. Copy the **anon / public** key (a long string starting with `eyJ...`)
   into `VITE_SUPABASE_ANON_KEY`
5. Save `.env.local`

Don't close the Supabase API tab yet — you'll need the JWT Secret for
the proxy in a moment.

---

## 1.6 — Deploy the Val.town proxy

If you still have your existing val from earlier, we'll overwrite it
with the new secure version. If you'd rather leave the old one alone,
create a new HTTP val instead — it doesn't matter.

1. Open val.town, go to your val (or create a new HTTP val)
2. Delete all the code in `main.ts`
3. Paste in the contents of `proxy/dar-tracker-server.val.ts` from the
   repo
4. Save

The URL at the top of the val (something like
`https://yourname--xxx.web.val.run`) is what you'll need in a moment.

---

## 1.7 — Add environment variables to the val

1. In Val.town, on the val's page, look for **Env vars** in the
   left sidebar (below Logs and Analytics)
2. Add two variables:
   - **CLOCKIFY_API_KEY**: your Clockify API key
     (find it in Clockify → Profile settings → API)
   - **SUPABASE_JWT_SECRET**: in Supabase → Project Settings → API,
     scroll down to **JWT Settings**, copy the **JWT Secret**
3. Save

Test it: visit your val's URL in a browser. You should see
`{"error":"missing_bearer_token"}` — that's correct, it means the val
is running and correctly rejecting unauthenticated requests.

---

## 1.8 — Copy the val URL into .env.local

1. Copy the val URL (the one that returned `missing_bearer_token`)
2. Paste it into `VITE_CLOCKIFY_PROXY_URL` in `.env.local`
3. Save

---

## Done with Phase 1

Your `.env.local` should now have three values filled in. Move on to
Phase 2 (smoke test) — start the dev server with `npm run dev` and see
if the app comes up.

If anything went wrong, the most common issues:
- **"Missing Supabase env vars" error on load** — you didn't restart
  the dev server after editing `.env.local`. Vite only reads env vars
  at startup.
- **GitHub sign-in loops back to sign-in** — the callback URL in your
  GitHub OAuth app doesn't match Supabase's callback URL exactly. Copy
  it again, paying attention to trailing slashes.
- **Clockify import returns "unauthorized"** — the JWT secret in the
  val doesn't match Supabase's. Copy it again from Supabase → Project
  Settings → API → JWT Settings.
