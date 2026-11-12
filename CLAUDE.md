# Thess's Personal AI Content & Growth Manager

Personal, single-owner web app that turns Thess's ideas and learning into review-ready social content (LinkedIn first; Instagram, Facebook, TikTok adapted). It drafts and recommends; Thess reviews and approves.

**Source of truth:** `docs/PRD.md` (PRD v2.1) plus `docs/PRD-amendments.md` (v2.2, which wins where they differ). Read the relevant sections before any milestone. If code and PRD conflict, stop and report it.

## How to work

1. Build one milestone at a time, in the order of PRD Section 21. Propose a small plan, wait for approval, then implement only that milestone.
2. Do not start the next milestone until the current one passes its acceptance criteria (PRD Section 20).
3. Add or update tests and documentation with every milestone.
4. **Ask first** before: adding a paid service, changing the stack, enabling any automatic publishing, or expanding scope.
5. Never invent credentials, API capabilities, integrations, data, user preferences, brand colours or logos. Use placeholders until Thess supplies them.
6. Verify model names, API versions, plan requirements and pricing against official docs at build time. Never hardcode an unverified model ID; the model comes from `AI_MODEL`.
7. Ship a reliable content workflow before adding agent autonomy. Prefer deterministic application code over multi-agent handoffs.

## Reporting to Thess

- Write in simple, plain English. Thess is not assumed to be a developer.
- When she must do something (create an account, copy a key, click a setting), give numbered step-by-step instructions.
- End every milestone with: what was built, files changed, database changes, environment variables required, how to run it, how to test it, known limitations, next recommended milestone.

## Stack (PRD Section 16)

- Next.js 16 App Router + TypeScript, Tailwind CSS 4. Next.js 16 differs from older versions (see `AGENTS.md`): read `node_modules/next/dist/docs/` before using an API. Middleware is now `src/proxy.ts`.
- Supabase: PostgreSQL, Auth (single owner), Storage
- Anthropic API behind a provider adapter (`AI_PROVIDER`, `AI_MODEL`, optional `AI_FALLBACK_MODEL`)
- Research: Anthropic web search tool behind a search adapter
- Hosting: Vercel. Email: Resend. Version control: private GitHub repo
- Timezone: `Africa/Lagos` (UTC+1, no daylight saving). Sunday 18:00 WAT = cron `0 17 * * 0` in UTC

## Hard rules

### Security
- Secrets live only in server-side environment variables. Never in client code, logs, generated files or commits. Never commit `.env` files.
- Never prefix a private secret with `NEXT_PUBLIC_`. Never send the Supabase service-role key to the browser.
- Every private route requires authentication. Owner-only access in v1.
- Row Level Security enabled on every user-owned table.
- All schema changes go through migrations. No undocumented manual production changes.
- Validate input and output at API boundaries (Zod). Validate file uploads (type and size).
- Protect scheduled-job endpoints with `CRON_SECRET`.
- Do not log full prompts or uploaded confidential content.

### Content safety (PRD Section 13)
- Nothing is ever published automatically in v1. Human approval always.
- No employer, client, colleague or customer names, internal project names, internal figures, screenshots or credentials in public content.
- Unknown confidentiality defaults to "Unknown — requires review".
- Every draft carries `safety_status` (clear / needs_review / blocked), `safety_reasons`, `needs_user_confirmation`, `review_notes`. A blocked draft cannot be marked ready.

### Content integrity
- Never fabricate anecdotes, results, statistics, quotes, credentials, sources, dates or analytics.
- Keep measured, manually entered and unavailable metrics clearly distinct.
- Never overwrite an original idea or a previous post version. Keep history.
- Factual and time-sensitive claims need stored source URLs and dates.
- Respect the editable `banned_phrases` list and the voice rules in PRD Section 5.

### Architecture
- Every external integration (search, Canva, Metricool, email, transcription) sits behind an adapter with a capability check and a manual fallback. A failed integration must not break the core content workflow.
- AI output is structured JSON validated by schema. Malformed output is retried or shown as an error, never saved as a ready draft.
- Scheduled jobs are idempotent and run as resumable steps (PRD Section 14.1a).
- Record AI usage (model, tokens, estimated cost) in `usage_logs`.
- No scraping of LinkedIn or other platforms. No mass-commenting, mass-following or automated DMs.

### Testing
- Use fictional test data only. Never real work or client records in fixtures.

## Commands

- `npm run dev`, `npm run build`, `npm test`, `npm run typecheck`, `npm run lint`
- Supabase project ref: `fabxgpnhbonuhudybzbo` (eu-west-1). Apply schema changes with a file in `supabase/migrations/` and the Supabase MCP `apply_migration`.
- The cloud sandbox cannot reach the Supabase host, so database checks run through the Supabase MCP, not from the app.

## Code conventions

- Private pages live in `src/app/(app)/`; its layout calls `requireOwner()`. Every new private route handler and server action must call `requireOwner()` too.
- Public paths are listed only in `src/lib/auth/paths.ts`.
- Colours and fonts are tokens in `src/app/globals.css` (plum, violet accent, gold: a starting palette Thess asked for, not a supplied brand kit). Shared class names are in `src/components/ui.ts`; use them and `platformChip()` rather than new one-off styles.
- Platforms: LinkedIn, Instagram + Facebook (one shared post), TikTok. Database values: `linkedin`, `instagram_facebook`, `tiktok`.
- All AI calls go through `generateStructured()` in `src/lib/ai/provider.ts` with a Zod schema from `src/lib/ai/schemas.ts`, and are recorded with `logUsage()`. Model comes from `AI_MODEL` (default `claude-opus-5-5`); prices in `src/lib/ai/pricing.ts`.
- Drafting goes through `draftFromIdea()` in `src/lib/drafting.ts`: one AI request returns LinkedIn plus the Instagram + Facebook caption. TikTok is on demand.
- Web searches use the cheaper `AI_RESEARCH_MODEL` (default `claude-haiku-5-5`) and fall back to the main model once if that fails. Searches were about 80% of early spend, so keep search counts low.
- Graphics are drawn in the browser by `src/components/visual-studio.tsx` using `fitText()` from `src/lib/content/wrap.ts`. A single card needs no AI call; a carousel needs one call for slide text (`writeCarousel`).
- `requireOwner()` is wrapped in React `cache()`, the proxy uses `getClaims()`, and Vercel functions run in `dub1` (next to the Supabase region) via `vercel.json`. Keep these when touching auth, or navigation gets slow.
- Web search goes through `searchWeb()` in `src/lib/ai/research.ts`. Source links are read from the search results, never from model prose. A failed search never blocks a draft.
- Dates found by web search (`calendar_events`) are only saved when the source link came back from the search and the date is valid and in the window.
- Analytics are manual entry. An empty box is stored as null ("not available"), never zero. Page numbers are per platform per week (Instagram and Facebook separately); post numbers are per post.
- A rewrite saves the old wording to `post_versions` before updating the post.
- Dates are `YYYY-MM-DD` strings in Africa/Lagos; use `src/lib/dates.ts`, never raw `new Date()` arithmetic.
- Server actions redirect with `?saved=` or `?error=` codes; pages turn the codes into plain messages.
- Confidentiality (decided by default, Thess did not answer): no field in the UI; a quiet check inside the draft request only shows a note when `safety_status` is not `clear`.
- To check screens locally, the sandbox needs a stand-in for Supabase (it cannot reach the real host).

## Milestone status

- [x] Phase 0 — Project foundation (complete; live at https://thess-content-manager.vercel.app, sign-in confirmed by Thess on 12 Nov 2026)
- [ ] Phase 1a — Fast first use (scope extended, see `docs/PRD-amendments.md`)
  - [x] Part 1 built: Settings, voice seeding, AI adapter, Idea Inbox, drafts per platform, draft review, This Week board (awaiting Thess's test with a real API key)
  - [x] Part 2 built: Calendar, Home dashboard, live web check, trending ideas, follow-up answers with saved versions, weekly plan button (awaiting Thess's test)
- [x] Holidays and key dates, and Analytics, built (awaiting Thess's test). Automatic holiday drafting needs the scheduler and is not built.
- [x] Designed graphics and carousel designer built (drawn on a canvas in the browser; awaiting Thess's test). No PDF export yet.
- [ ] Remaining PRD phases (research automation, learning, integrations)
