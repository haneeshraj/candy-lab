# Supabase setup — Releases CMS

The **Releases** feature stores its data in Supabase (Postgres + Storage). To
keep the renderer sandboxed, the Supabase client runs **only in the Electron
main process** (`src/main/services/supabase.service.ts`) and is reached from the
UI through the curated `window.api.releases.*` bridge — the renderer never talks
to Supabase directly and never sees the key.

## 1. Create a project

1. Go to <https://supabase.com/dashboard> and create a new project.
2. Wait for it to finish provisioning.

## 2. Create the schema + storage bucket

Open the project's **SQL Editor**, paste the contents of
[`schema.sql`](./schema.sql), and run it. This creates:

- `releases`, `artists`, and the `release_artists` junction table
- helpful indexes
- Row Level Security **enabled with no public policies** (locked down)
- a **public** storage bucket named `release-media` (cover art + canvas videos)

## 3. Get your credentials

In the dashboard: **Project Settings → API**.

- **Project URL** → `MAIN_VITE_SUPABASE_URL`
- **`service_role` secret key** → `MAIN_VITE_SUPABASE_KEY`

> **Why the service-role key (not anon)?** It lives only in the trusted main
> process and is never bundled into the renderer, so the database can stay fully
> locked (RLS on, no public policies). The service role bypasses RLS, which is
> exactly what a trusted local admin tool wants. **Never** expose this key to the
> renderer or commit it.

## 4. Wire up `.env`

Copy `.env.example` to `.env` (if you haven't) and fill in:

```dotenv
MAIN_VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
MAIN_VITE_SUPABASE_KEY=eyJhbGciOi...   # service_role secret
```

The `MAIN_VITE_` prefix tells electron-vite to inject these into the **main**
bundle only. Restart `npm run dev` after editing `.env`.

## 5. Verify

Run the app (`npm run dev`), open **Releases**, and click **Add Release**. If the
credentials are missing or wrong, the UI shows a clear "Supabase isn't
configured" error instead of crashing.

---

## 6. Auth — Google sign-in & access control

The app is gated: people sign in with Google, land as **pending**, and an
**admin** approves or bans them. Identity uses Supabase Auth; the desktop app
drives Google OAuth from its **main process** via a loopback redirect (the
renderer never handles tokens).

### a. Run the auth schema

Run [`migrations/002_auth_profiles.sql`](./migrations/002_auth_profiles.sql) (or
the auth section of `schema.sql`). It creates the `profiles` table + the trigger
that auto-creates a `pending` profile on first sign-in.

### b. Create a Google OAuth client

1. In **Google Cloud Console → APIs & Services → Credentials**, configure the
   OAuth consent screen, then create an **OAuth client ID** of type
   **Web application**.
2. Add this **Authorized redirect URI** (Supabase's callback):
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client secret**.

### c. Enable Google in Supabase

- **Auth → Providers → Google** → enable, paste the Client ID + secret.
- **Auth → URL Configuration → Redirect URLs** → add the app's loopback URL:
  `http://localhost:51789/callback`

### d. Bootstrap yourself as admin (one-time)

Sign in through the app once (this creates your `pending` profile), then run:

```sql
update public.profiles set role = 'admin', status = 'approved'
where email = 'banisetti.h@northeastern.edu';
```

Restart the app — you now have full access and the **Access** admin panel, where
you approve/ban everyone else.
