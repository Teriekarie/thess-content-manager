# Thess's Personal AI Content & Growth Manager

A private web app that turns ideas and learning notes into review-ready social posts. See `docs/PRD.md` and `docs/PRD-amendments.md` for the full specification, and `CLAUDE.md` for the working rules.

**Current milestone:** Phase 1a (parts 1 and 2). Settings, voice guide, Idea Inbox with trending suggestions, AI drafts with an optional live web check, draft review with follow-up answers, the This Week board with a plan button, Calendar and the Home dashboard. Also Holidays and key dates (found by live web search, drafted and scheduled on request) and Analytics (weekly page numbers and per-post numbers, entered by hand). Designed graphics and carousels are drawn by the app in the browser and downloaded as PNG files.

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
| `ANTHROPIC_API_KEY` | Lets the app use Claude. Created at console.anthropic.com | **Yes, server only** |
| `AI_RESEARCH_MODEL` | Optional. The cheaper model used only for web searches. Defaults to `claude-haiku-5-5` | No |
| `AI_MODEL` | Optional. Which Claude model writes the drafts. Defaults to `claude-opus-5-5`; `claude-sonnet-5-5` and `claude-haiku-5-5` are cheaper | No |

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

## How drafting works

1. An idea is saved in `ideas` and never changed afterwards.
1. If "Check the web first" is ticked, `src/lib/ai/research.ts` runs up to two live web searches and keeps the notes and source links with the draft. If the search fails, the draft is still written.
2. `src/lib/ai/prompts.ts` builds the request from your settings, voice guide and the idea.
3. `src/lib/ai/provider.ts` calls Claude and checks the answer against a fixed shape (`src/lib/ai/schemas.ts`). An answer that does not fit is retried once, then reported as an error. Nothing malformed is saved.
4. `src/lib/content/drafts.ts` tidies the answer and it is saved in `posts`.
5. Each AI call is recorded in `usage_logs` with token counts and an estimated cost. Prompts and answers are not logged.

To change the model, set `AI_MODEL` in Vercel and redeploy. Prices for the estimate live in `src/lib/ai/pricing.ts`.

## Known limits

- The sign-in link must be opened in the same browser that requested it.
- Supabase's built-in email sender allows only a few emails per hour.
- The spend estimate counts AI tokens only, not the per-search fee for web checks.
- Hashtags come from public web pages; the app cannot see each platform's own hashtag performance.
- Carousels download as PNG images; there is no PDF export yet.
- On a phone the menu sits above the page content.
