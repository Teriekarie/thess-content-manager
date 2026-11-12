# PRD amendments (v2.2)

Agreed with Thess on 11 November 2026 after reviewing the design preview. Where this file and `PRD.md` (v2.1) disagree, this file wins.

## Changes

1. **Instagram and Facebook share one post.** One adaptation is written and labelled "Instagram + Facebook". Platforms are therefore: LinkedIn, Instagram + Facebook, TikTok.
2. **Every post shows its platform, length (long or short form) and visual type** on the This Week board.
3. **Post outcomes.** Each post can be marked Posted, carried over to Next week, Scheduled for a chosen date, or Discarded. Any of these can be undone or changed later.
4. **Calendar screen (new).** Month view of posted and scheduled posts, with reschedule, mark as posted and discard. "Save for later" always carries a date. Scheduling is a plan and reminder only; Thess still copies and pastes.
5. **Holidays and key dates screen.** Upcoming Nigerian holidays, global occasions and tech days, refreshed from the web. Posts can be generated per platform and are scheduled on the calendar for that date. Optional automatic drafting one week ahead.
6. **Live web check when drafting** (pulled forward from Phase 2). Before writing, the AI searches the web for what is recent on the topic and which hashtags are in use, and stores the sources with links and dates. Limit: it cannot see platforms' private hashtag performance data and must not scrape platforms.
7. **Trending ideas.** A "Find trending ideas" action in the Idea Inbox suggests ideas from current topics in AI, automation, data and work life.
8. **Tone.** Each idea has a tone: Let the AI decide, Light and funny, My opinion, A school of thought, Practical and serious. Humour is welcome. The rule against inventing anecdotes, results or facts still applies; if a post needs a real detail, the AI asks.
9. **Clarifying questions.** The AI may ask one or two short questions to fill in details before or after drafting.
10. **Visual choice per post.** The AI asks: generate an image, design a carousel, use my own photo (added by Thess on the platform, not uploaded here), or no visual.
11. **SEO on every post.** Each draft lists the keywords worked into it and checks that the topic is clear in the first line. No promises of reach.
12. **Home dashboard.** Totals for generated, posted, liked, not liked, carried over and discarded, plus a per-platform table.
13. **Analytics (pulled forward from Phase 4).** Weekly page numbers per platform, and per-post performance including the hashtags used. Searchable by week, month, post or hashtag. Empty values are stored as "not available", never zero.
14. **Confidentiality field removed from the Idea Inbox.** Thess does not enter confidential material. See open decisions.
15. **Direct posting and scheduling to platforms is version 2.** Version 1 remains copy and paste.
16. **Sign-in stays**, by email link, owner only.

## Revised build order

1. Phase 0: foundation and sign-in.
2. Phase 1a: Settings, voice seeding, Idea Inbox with tone, drafts per platform with live web check and SEO, This Week board with post outcomes, Calendar, Home dashboard.
3. Holidays and key dates, then Analytics.
4. Image generation and the carousel designer.
5. Remaining PRD phases.

## Open decisions

- **Confidentiality check.** Remove completely, or keep a quiet background check that only speaks up when a draft contains something like a company name. Not yet answered.

## Decided since

- **Images (11 November 2026).** No external image service. The app creates its own designed graphics (text cards, simple illustrations, carousels) drawn by the app from AI-written layouts. Realistic photos are added by Thess manually on the platform.

- **Look and feel (12 November 2026).** Thess asked for a warmer, less plain design. A starting palette (plum sidebar, violet accent, gold highlight) is set in `src/app/globals.css`. It is not a final brand kit and can be replaced there.
- **Trending ideas (12 November 2026).** Must cover a wide range: AI, automation, data, careers, African tech and working life, with no two suggestions about the same company or product.
- **Weekly plan (12 November 2026).** When this week's posting days have passed or are full, the plan button fills next week instead.
- **Handle on graphics (12 November 2026).** Thess's handle is @teriekarie. It is stored in `brand_settings.handle`, editable in Settings, and drawn on every graphic and carousel slide.
- **Holidays and dates (12 November 2026).** Not only Nigerian dates: international days, global occasions, cultural and shopping moments and tech events, over the next three months.
