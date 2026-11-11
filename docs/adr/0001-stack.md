# ADR 0001: Stack and foundation choices

Date: 11 November 2026. Status: accepted.

## Decisions

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | PRD Section 16. One codebase for pages and server code, so secrets stay on the server. |
| Styling | Tailwind CSS 4 | PRD Section 16. Colours and fonts are theme tokens in `src/app/globals.css`, so the brand kit can replace the placeholders in one place. |
| Database, auth | Supabase (Postgres, Auth) | PRD Section 16. Row Level Security protects data even if app code has a bug. |
| Sign-in | Email magic link, owner only | No password to remember or leak. |
| Tests | Vitest | Fast, no browser needed for Phase 0 logic. |
| Hosting | Vercel | PRD Section 16. |

## Details worth knowing

- **Owner-only access has three layers.** (1) `src/proxy.ts` sends signed-out visitors to `/login`. (2) `requireOwner()` in the private layout checks the signed-in email against `OWNER_EMAIL`. (3) Row Level Security only lets a user read their own rows.
- **The login page gives the same answer for every email**, so it does not reveal the owner's address. A sign-in email is only sent for `OWNER_EMAIL`.
- **Next.js "Cache Components" is switched off.** Every page is private and per-user, so prerendering gives little, and leaving it off keeps the code simpler.
- **The service-role key is not used in Phase 0.** All database access goes through the signed-in user's session.
- **Schema changes go through `supabase/migrations/`.** Each file there has been applied to the Supabase project.
- **`/api/health` is public** and returns only `ok` or `unreachable`.
