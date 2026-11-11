# Thess's Personal AI Content & Growth Manager

A private web app that turns ideas and learning notes into review-ready social posts. See `docs/PRD.md` and `docs/PRD-amendments.md` for the full specification, and `CLAUDE.md` for the working rules.

**Current milestone:** Phase 0 (foundation). Sign-in, protected pages, the database and an empty app shell. No AI features yet.

## Run it on your computer

1. Install Node.js 22 or newer.
2. Install the packages:

```bash
npm install
```

3. Copy the settings file, then fill in the values (see the table below):

```bash
cp .env.example .env.local
```

4. Start the app, then open http://localhost:3000:

```bash
npm run dev
```

## Settings (environment variables)

| Name | What it is | Secret? |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Optional. The app's web address. On Vercel it is worked out automatically; set it only for a custom domain | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key | No (safe by design; Row Level Security protects the data) |
| `OWNER_EMAIL` | The only email address allowed to sign in | Server only |

Never commit `.env.local`. Never prefix a secret with `NEXT_PUBLIC_`.

## Check it

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run build
```

## Supabase set-up (one time)

In the Supabase dashboard, under Authentication, URL Configuration:

1. Set **Site URL** to the app's address.
2. Add `<app address>/auth/callback` to **Redirect URLs** (add `http://localhost:3000/auth/callback` too for local use).

After your first successful sign-in, under Authentication, Sign In / Providers, switch off **Allow new users to sign up**.

## Where things are

- `src/proxy.ts`: locks every page for signed-out visitors.
- `src/lib/auth/`: owner check and the list of public paths.
- `src/app/login/`, `src/app/auth/callback/`: sign-in.
- `src/app/(app)/`: the private pages.
- `src/app/api/health/`: status check.
- `supabase/migrations/`: database changes.
- `tests/`: automated tests.
- `docs/adr/`: decisions and reasons.

## Known limits in Phase 0

- The sign-in link must be opened in the same browser that requested it.
- Supabase's built-in email sender allows only a few emails per hour.
