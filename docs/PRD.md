# PRODUCT REQUIREMENTS & BUILD SPECIFICATION

> **Note:** amended by `docs/PRD-amendments.md` (v2.2). Where the two differ, the amendments win.
# Thess's Personal AI Content & Growth Manager

**Document:** Product Requirements Document (PRD) + Technical Build Specification  
**Version:** 2.1  
**Status:** Ready for phased implementation  
**Owner:** Thess  
**Primary timezone:** Africa/Lagos (WAT, UTC+1)  
**Primary platform:** LinkedIn  
**Other channels:** Instagram, Facebook and TikTok  
**Last reviewed:** 11 November 2026

**Changes in v2.1:**
- Added Phase 1a (fast first usable release) before full Phase 1.
- Fixed the weekly schedule conversion (Sunday 18:00 WAT = Sunday 17:00 UTC, cron `0 17 * * 0`).
- Research starts with the Anthropic web search tool; a separate search API is optional.
- Weekly run must execute in resumable steps to avoid serverless timeouts.
- Added "Learning note" input type and a standard prompt for turning Claude/AI work sessions into ideas.
- Added posting-day reminders.
- Added a monthly AI budget cap.
- Added voice seeding with Thess's own writing samples.
- Clarified realistic limits of the growth assistant.
- Flagged likely plan requirements for Canva and Metricool APIs.
- Documentation deliverables renamed to Project Brief, SOP and Handover Note.
- Added extra banned phrases.

---

## 0. Instructions for Claude Code

This document is the product source of truth for the first release.

Before making changes:
1. Read this document in full.
2. Inspect the existing repository and report what already exists.
3. Identify conflicts between the existing code and this specification.
4. Propose a small implementation plan for the next milestone.
5. Implement only the approved milestone. Do not attempt to build the entire product in one pass.
6. Add or update tests and documentation with every milestone.
7. Never invent credentials, API capabilities, integrations, data or user preferences.
8. Keep integrations optional and isolate them behind adapters.
9. Do not expose secrets in client-side code, logs, generated files or commits.
10. Ask before introducing paid services, changing the stack, enabling automatic publishing, or expanding scope.

**Build principle:** ship a reliable, useful content workflow before adding complex agent autonomy.

---

# 1. Product vision

Build a personal AI-powered social media management and professional growth workspace for Thess.

The application should help Thess consistently publish useful, credible and recognisably personal content by combining:

- Her professional knowledge, experiences, experiments and opinions.
- Relevant industry and technology research.
- A clear personal-brand strategy.
- Platform-aware content creation and repurposing.
- Visual and video production support.
- Feedback and performance learning.
- Practical audience-growth recommendations.

This is not simply an AI caption generator or a generic social media scheduler.

It is a **Personal AI Content & Growth Manager** that functions like a small digital content team: strategist, researcher, writer, editor, creative assistant and performance analyst.

The application must preserve Thess's judgement and control. It prepares recommendations and drafts; Thess reviews, edits and approves them.

## 1.1 Product principles

1. **Authenticity over volume:** never create weak content merely to fill a calendar.
2. **Substance over trends:** trending topics must be relevant and add value.
3. **Experience before generic commentary:** prioritise Thess's real learning, projects, experiments and opinions.
4. **LinkedIn-first:** create the strongest professional version for LinkedIn, then adapt appropriately for other channels.
5. **Human approval:** nothing is published automatically in v1.
6. **Evidence-based research:** factual and time-sensitive claims need reliable sources.
7. **Privacy by design:** employer, client and confidential information must not enter public content.
8. **Learning, not blind automation:** feedback and performance inform recommendations but do not dictate them.
9. **Modular architecture:** a failed external integration must not break the core content workflow.
10. **Build in phases:** do not over-engineer the first release.

---

# 2. Outcomes and success measures

## 2.1 Primary outcomes

1. Publish at least three purposeful LinkedIn posts per week.
2. Adapt selected content for Instagram, Facebook and TikTok.
3. Build visibility as a practical AI, automation and data solutions professional.
4. Attract relevant recruiters, hiring managers, technical peers, collaborators and potential consulting clients.
5. Grow a relevant professional audience, especially on LinkedIn.
6. Turn rough thoughts, learning experiences and completed experiments into publishable content.
7. Reduce the time and mental effort required to plan and create content.

## 2.2 Audience priorities

The system should serve two connected audiences:

**Professional opportunity audience**
- Recruiters and talent partners.
- Hiring managers and business leaders.
- Technology, automation, analytics and operations teams.
- Potential consulting clients and collaborators.

**Professional community audience**
- Data and automation practitioners.
- AI builders and curious professionals.
- No-code/low-code and business systems communities.
- People learning how to apply technology to real business problems.

Do not optimise exclusively for follower count. Audience relevance and meaningful professional opportunities matter more than vanity metrics.

## 2.3 Success metrics

Track, where available:

- LinkedIn posts published per week (target: 3).
- Follower growth by platform.
- Impressions and reach.
- Reactions, comments, reposts/shares and saves.
- Engagement rate, with the formula and denominator clearly identified.
- Profile views and search appearances where the platform exposes them.
- Link clicks where available.
- Relevant inbound messages, recruiter conversations and professional opportunities (manual tracking is acceptable).
- Content production time and approval rate.
- Performance by pillar, format, topic and platform.

The application must distinguish **measured metrics**, **manually entered metrics** and **unavailable metrics**. Never fabricate missing analytics.

---

# 3. Brand positioning and professional context

## 3.1 Working positioning

**AI, Automation & Data Solutions**

Thess works at the intersection of:
- AI and intelligent automation.
- Business systems and workflow engineering.
- Data analytics, reporting and business intelligence.
- AI agents and practical AI implementation.
- Digital transformation and operational efficiency.
- Building, testing and learning with emerging tools.

The positioning should communicate a hands-on professional who explores technology, builds practical solutions, understands limitations and translates technical capabilities into business value.

This is a working positioning, not a permanently fixed job title. Store it as editable brand configuration.

## 3.2 Professional context available to the agent

Use these as starting context, not as claims to insert into every post:

- Professional focus: data analysis, workflow automation, business systems, AI-enabled solutions and project delivery.
- Tools and platforms may include: Zapier, Make, n8n, Airtable, Softr, Formstack, GoHighLevel, Zoho, Microsoft 365, Copilot, Power Automate, SharePoint, Power BI, Looker Studio, Tableau, Streamlit, SQL, Python, APIs and webhooks.
- AI-assisted building and experimentation may involve Claude, Claude Code, Copilot and other tools.
- Thess is based in Nigeria. Use `Africa/Lagos` for scheduling and local context.
- Thess wants to share practical lessons from building, testing, learning and solving problems.

**Important:** the tool list is editable and should distinguish:
- Regularly used tools.
- Tools currently learning.
- Tools tested experimentally.
- Tools with demonstrated project experience.

Do not imply expert-level proficiency in a tool merely because it appears in the list.

## 3.3 Brand knowledge records

The application should maintain editable records for:
- Professional bio and positioning.
- Skills and proficiency levels.
- Career goals and audience priorities.
- Approved public projects and demonstrations.
- Learning log.
- Personal opinions and recurring themes.
- Preferred writing examples.
- Social profile URLs and handles.
- Brand assets and photo library.

---

# 4. Audience and content strategy

## 4.1 Content pillars

Use eight pillars. The percentages are initial planning guidance, not rigid quotas. The planner should review the mix monthly and avoid forcing a pillar when there is no worthwhile idea.

| Pillar | Purpose | Initial mix |
|---|---|---:|
| AI, agents & intelligent automation | Explain practical AI, agents, automation patterns, use cases and limitations | 18% |
| Data, analytics & business intelligence | Dashboards, Power BI, data storytelling, reporting and decision support | 15% |
| Building in public & experiments | Things Thess builds, tests, learns, breaks and improves | 20% |
| Industry perspectives & opinions | Relevant developments explained in Thess's own words and perspective | 15% |
| Educational content & tool guides | Practical explainers, comparisons, frameworks and tutorials | 12% |
| Career, growth & personal experiences | Learning curves, professional lessons, challenges and milestones | 10% |
| Relatable technology humour | Human, witty and recognisable observations about technology and work | 5% |
| Reflections & inspiration | Thoughtful lessons and encouragement grounded in real experience | 5% |

Awareness days, holidays, events and major announcements are **timely opportunities**, not a separate quota. Use them only when there is a genuine connection to Thess's professional identity or audience.

Each weekly plan should normally cover at least three pillars.

## 4.2 Editorial quality rules

A post should be recommended only when it has a clear reason to exist.

For each candidate topic, evaluate:
- Relevance to Thess's positioning.
- Usefulness to the intended audience.
- Originality or distinctiveness.
- Evidence and source quality, where applicable.
- Timeliness.
- Opportunity to add a real perspective or example.
- Confidentiality risk.
- Whether the topic has been covered recently.
- Likely content objective: reach, authority, trust, conversation or opportunity.

Do not publish generic AI news summaries, recycled motivational quotes or tool lists without a useful angle.

## 4.3 Weekly editorial rhythm

Starting schedule:

- **Monday or Tuesday:** authority, industry perspective, practical insight or informed opinion.
- **Wednesday or Thursday:** build log, educational content, tool experiment or demonstration.
- **Friday or weekend:** personal reflection, relatable technology humour, career lesson or community conversation.

These are starting experiments, not claims about universally optimal posting times. Allow the user to configure days and times. Use actual account performance to test and adjust.

Target: three core LinkedIn posts each week. Do not exceed five LinkedIn posts in a week without user direction.

The weekly plan may recommend additional posts when an unusually relevant development occurs, but must explain why.

## 4.4 Content objectives

Every planned post should have one primary objective:
- Discoverability.
- Demonstrate expertise.
- Build trust.
- Start a meaningful conversation.
- Show practical work.
- Strengthen professional relationships.
- Attract relevant career or consulting opportunities.

Do not make every post a sales pitch or every post an engagement question.

---

# 5. Voice, tone and writing rules

## 5.1 Voice

- Clear, natural, everyday English.
- Warm, thoughtful and direct.
- Professional without sounding corporate or stiff.
- Confident but not boastful.
- Occasionally witty and humorous.
- Curious and practical.
- Comfortable acknowledging uncertainty, limitations and learning.

The writing should sound like a knowledgeable person sharing an actual thought, not a marketing agency or generic AI account.

## 5.2 Writing rules

- Start with a specific, compelling opening. Avoid clickbait.
- Keep one central idea per post.
- Use short paragraphs and mobile-friendly spacing where appropriate.
- Use concrete details when provided: what was attempted, what failed, what changed and what was learned.
- Explain technical ideas in accessible language without oversimplifying them.
- Use a real question or clear takeaway when it suits the post.
- Vary structures and openings. Do not make every post follow the same template.
- Preserve Thess's point of view. Do not invent a stronger opinion than she supplied.
- Do not add fake personal anecdotes, project results, statistics, quotes or credentials.

## 5.3 Avoid

Avoid generic or overused expressions such as:
- "In today's fast-paced world"
- "Game-changer"
- "Unlock your potential"
- "Delve into"
- "Revolutionise everything"
- "I'm thrilled to announce" unless genuinely appropriate
- "Leverage" (as a verb), "synergy", "unleash"
- Empty phrases such as "AI is the future" without a specific argument.

Store this list as the editable `banned_phrases` setting.

Avoid:
- Excessive emojis.
- Repeated em dashes.
- Engagement bait such as "Comment YES".
- Artificial controversy.
- Fake vulnerability or manufactured personal stories.
- Keyword stuffing and irrelevant hashtags.
- Overly polished language that removes Thess's personality.

## 5.4 Living voice guide

Maintain a versioned voice guide based on:
- User-approved posts.
- User edits.
- Direct style instructions.
- Rejected drafts and reasons.

Do not allow one isolated rating to overwrite the entire voice guide. Require repeated evidence or explicit instruction before changing a persistent preference.

## 5.5 Voice seeding

The learning loop starts empty, so the first voice guide must be seeded from real writing.

During setup, Thess provides 5–10 samples written by her that sound like her (past posts, messages, notes, captions). Optionally she also provides 2–3 examples of other people's posts she likes, labelled as "style references, not my words".

The app:
- Stores samples in `brand_knowledge` (category: `writing_sample` or `style_reference`).
- Generates voice guide version 1 from the samples plus Section 5.1–5.3.
- Shows the draft voice guide to Thess for approval before it becomes active.
- Never copies sentences from style references into drafts.

---

# 6. Platform strategy and output requirements

## 6.1 LinkedIn — primary platform

Purpose: professional visibility, authority, recruiter discovery, meaningful networking and consulting opportunities.

Supported formats:
- Text posts.
- Text plus image.
- Document/carousel posts.
- Short videos.
- Polls when there is a genuinely useful question.
- Newsletter/long-form article recommendations when the subject warrants depth.

Guidance:
- Target three posts per week.
- Use an informative, specific opening.
- Include relevant professional keywords naturally.
- Use readable paragraphs and appropriate length for the idea.
- Hashtags should be selective and relevant; do not force a fixed number.
- External links may be included when useful. The agent may recommend placing a link in the post or a follow-up comment, but must not present one tactic as a guaranteed algorithm rule.
- Suggest a CTA only when it supports the purpose of the post.
- Recommend a visual when it materially improves understanding.

For each LinkedIn draft, provide:
1. Primary post.
2. Two alternative hooks.
3. Primary objective.
4. Pillar and target audience.
5. Relevant keywords.
6. Optional hashtags.
7. Suggested CTA, if appropriate.
8. Source citations/links for factual claims.
9. Recommended visual or format.
10. Confidentiality review result.

## 6.2 Instagram

Purpose: visual storytelling, approachable education, personal connection and discoverability.

Formats:
- Carousel.
- Reels.
- Single-image graphics.
- Photo-led captions.
- Stories (ideas and story sequences may be recommended).

Adapt content rather than copying LinkedIn verbatim:
- Shorter, more visual captions where appropriate.
- Clear cover text for carousels.
- Reel scripts with a strong opening and visual progression.
- Relevant keywords in captions and on-screen text.
- Hashtags only when useful and relevant.

## 6.3 Facebook

Purpose: accessible conversation, community and sharing selected professional/personal content.

Adapt the strongest suitable posts into a more conversational format. Do not automatically duplicate every LinkedIn post.

## 6.4 TikTok

Purpose: short educational videos, practical demonstrations, relatable technology moments and personal learning stories.

For a recommended video, generate:
- Concept and objective.
- Hook for the first seconds.
- Spoken script.
- 3–5 content beats.
- On-screen text.
- Suggested shots or screen recordings.
- B-roll suggestions.
- Caption and relevant keywords.
- Optional hashtags.
- Suggested duration.
- Production difficulty and assets needed.

Thess initially records her own videos or screen demonstrations. AI avatar/talking-photo production is out of scope for v1.

## 6.5 Cross-platform repurposing

A single idea may generate platform-specific outputs, but the agent must:
- Preserve the central message.
- Adapt tone, length, structure and visual format.
- Avoid duplicate captions across every platform.
- Record the original source idea and relationships between derived assets.
- Avoid generating every possible format automatically.

## 6.6 Format recommendation rules

The agent should recommend a format based on the content, not a fixed quota:

- Process, steps, framework or comparison → carousel.
- Personal story, opinion or reflection → text-led post.
- Quick practical tip → short post, graphic or short video.
- Tool walkthrough or interface demonstration → screen-recording video or carousel.
- Complex subject needing depth → long-form article or newsletter.
- Strong visual lesson → infographic or carousel.
- Humorous observation → short text, meme-style graphic or video.
- Personal milestone → photo-led post with a thoughtful caption.

Always explain the recommendation briefly and allow Thess to override it.

---

# 7. Research and Industry Radar

## 7.1 Purpose

The Research Agent identifies timely, relevant and credible content opportunities. It should not flood the content calendar with headlines.

## 7.2 Research areas

Monitor:
- AI models, agents, agentic workflows and AI applications.
- Workflow automation, integrations, APIs and orchestration tools.
- Microsoft Copilot, Power Platform, Power BI and relevant Microsoft ecosystem changes.
- Data analytics, business intelligence and data engineering.
- No-code/low-code platforms and business systems.
- Digital transformation, productivity and operations.
- Relevant business and technology industry conversations.
- Skills, tools and capabilities appearing in relevant job descriptions.
- Major technology events, launches and product updates.
- Important awareness dates and relevant Nigeria/global occasions.

## 7.3 Source hierarchy

Prioritise:
1. Official product documentation, changelogs and announcements.
2. Original research, recognised industry reports and standards bodies.
3. Reputable technology publications.
4. Credible practitioners and expert commentary.
5. Community discussions as signals of questions and sentiment, not automatically as factual evidence.

## 7.4 Research record

Every research item should store:
- Headline/title.
- Publisher/source.
- Canonical URL.
- Publication date, if available.
- Date discovered.
- Topic/category.
- Short factual summary.
- Why it matters.
- Potential angle for Thess.
- Source reliability assessment.
- Verification status.
- Related content ideas.
- Expiry/relevance date where applicable.

## 7.5 Research rules

- Search for recent information using a defined date window.
- Verify important claims against primary sources when possible.
- Distinguish announcement date from article update date.
- Do not describe old news as breaking news.
- Do not invent dates, product capabilities, pricing or statistics.
- Keep source links with drafts that depend on them.
- If sources conflict, flag the conflict instead of choosing a convenient answer.
- Treat social posts and community content as unverified until corroborated.
- Do not copy article text. Summarise in original language and add a distinct perspective.
- If no worthwhile trend exists, say so. Do not manufacture an opportunity.

## 7.6 Opportunity scoring

Score candidate topics using configurable criteria:
- Brand relevance.
- Audience value.
- Timeliness.
- Original perspective potential.
- Evidence quality.
- Novelty relative to recent posts.
- Confidentiality risk.

Use a transparent score or priority label to help rank ideas. The score is a planning aid, not a prediction of virality.

## 7.7 Awareness days and holidays

Research relevant dates for the coming weeks, including:
- Technology, AI, data, cybersecurity and digital inclusion observances.
- Major professional events and conferences.
- Relevant Nigerian public holidays and cultural occasions.
- Major global events where there is a meaningful professional connection.

Do not force unrelated international awareness days into the calendar. Verify dates from reliable sources.

---

# 8. Idea Inbox and thought-to-content workflow

## 8.1 Capture methods

Allow Thess to submit:
- Free text.
- Rough notes and bullet points.
- Voice-note transcripts.
- Images and screenshots.
- Links to articles, posts and videos.
- Uploaded documents.
- Project/learning summaries.
- Questions, opinions and observations.

- **Learning notes** from AI-assisted work sessions (see 8.5).

For v1, voice notes may be uploaded or transcribed by an external service/manual transcript. Native real-time transcription is not a launch requirement.

## 8.2 Idea record

Each idea should capture:
- Raw input.
- Input type.
- Created date.
- Optional source URL or file.
- Optional platform preference.
- Optional format preference.
- Related tool/topic.
- Confidentiality classification.
- Processing status.
- Generated angles and linked posts.

Never overwrite the original idea when generating or editing content.

## 8.3 Thought-to-content workflow

1. Thess submits an idea.
2. Agent identifies the central insight and intended audience.
3. Agent checks whether clarification is needed. Ask one focused question only when missing information would materially affect accuracy.
4. Agent proposes up to three distinct content angles when useful.
5. Agent recommends the best format and explains why.
6. Agent generates the selected draft and supporting assets.
7. Agent performs quality, factual and confidentiality checks.
8. Thess edits, approves, rejects or requests a different direction.
9. Approved content can be added to the weekly planner.
10. Original idea, generated content and revisions remain linked.

## 8.4 Idea status

Suggested statuses:
- New.
- Needs clarification.
- Analysed.
- Ready to draft.
- Drafted.
- Planned.
- Used.
- Archived.

## 8.5 Learning notes from work sessions

Much of Thess's best content comes from work she does with AI tools (Claude, Copilot and others): what she built, what blocked her, how she fixed it and what she learned.

Add an input type `learning_note` with a structured form:
- What I was trying to do.
- Tools used.
- Blockers.
- How I solved them (or didn't).
- What I learned.
- Open questions.
- Confidentiality: classification (default: Unknown — requires review).

Provide a copyable **standard prompt** in the Idea Inbox that Thess can paste at the end of any AI chat session:

```
Summarise this session as a learning note for my content agent.
Use these headings: What I was trying to do / Tools used / Blockers /
How I solved them / What I learned / Open questions.
Remove all company, client and colleague names, internal project names,
real figures, URLs and anything confidential. Replace them with generic
descriptions (e.g. "an oil & gas services company").
Keep it in plain, simple English.
```

Thess pastes the result into the Idea Inbox as a learning note. The Safety Reviewer still checks it.

Later enhancement: a protected API endpoint or MCP server so AI tools can send learning notes straight to the inbox.

---

# 9. Content Studio and creative production

## 9.1 Content package

For a content idea, the studio may produce:
- Main copy.
- Alternative hooks.
- Short and long versions.
- Platform-specific versions.
- CTA options.
- Keywords and hashtags.
- Carousel outline and slide copy.
- Graphic brief.
- Video script and storyboard.
- Image-generation brief.
- Photo placement recommendations.
- Source references.

Only produce the assets appropriate to the idea. Do not generate a carousel, graphic and video for every post.

## 9.2 Carousel builder

The agent should return structured slide data using a validated schema, for example:

```json
{
  "title": "Carousel title",
  "slides": [
    {
      "slide_number": 1,
      "role": "cover",
      "headline": "A clear opening",
      "body": "Optional supporting copy",
      "layout": "cover",
      "image_prompt": null,
      "photo_slot": false
    }
  ],
  "closing_slide": {
    "headline": "Key takeaway",
    "cta": "Optional CTA"
  }
}
```

The application, not the language model alone, validates the schema and renders the slides.

Initial output targets:
- Portrait 4:5 layout, 1080 × 1350 pixels.
- LinkedIn document export as PDF, after checking platform requirements at implementation time.
- Instagram-ready PNG/JPEG slides.
- Preview before export.
- Editable text and layouts.
- Consistent margins, hierarchy and readable typography.

Start with 4–5 clean templates:
1. Editorial/educational.
2. Step-by-step process.
3. Comparison.
4. Quote/insight.
5. Personal story/build log.

## 9.3 Photo library

Allow Thess to upload and label approved personal photos.

Store:
- Asset location.
- Description/label.
- Upload date.
- Usage notes.
- Optional tags.
- Consent/usage status.

The agent can recommend where a personal photo would improve a post. It must not alter identity, imply a false event or generate misleading depictions of Thess.

## 9.4 Brand kit

Editable settings:
- Primary and secondary colours.
- Fonts.
- Logo or initials.
- Social handles.
- Preferred visual style.
- Image treatment.
- Carousel templates.
- Photo library.

Do not invent brand colours or logos. Use placeholders until Thess supplies or approves them.

## 9.5 Video production

V1 creates scripts, shot lists, on-screen text and storyboards. It may help organise user-supplied clips and images, but automated AI-avatar production is a later feature.

The system should distinguish:
- Talking-head video.
- Screen recording.
- Voiceover with visuals.
- Photo montage.
- Text-led motion graphic.

---

# 10. SEO and discoverability

## 10.1 Keyword strategy

Maintain a configurable keyword library, initially including:
- AI automation.
- AI agents.
- Workflow automation.
- Business process automation.
- Data analytics.
- Business intelligence.
- Power BI.
- Microsoft Copilot.
- Copilot agents.
- Power Automate.
- n8n.
- No-code and low-code.
- CRM automation.
- Business systems.
- Dashboards.
- Data-driven decision-making.
- Digital transformation.

Add tool-specific and topic-specific keywords when relevant. Do not insert every keyword into every post.

## 10.2 Platform-aware optimisation

- LinkedIn: professional search terms, clear subject in the opening, relevant profile positioning and useful expertise signals.
- Instagram: searchable caption language, clear carousel cover text and descriptive on-screen text.
- TikTok: topic clarity in spoken words, captions and on-screen text.
- Facebook: natural language and relevant community context.

Do not claim guaranteed ranking or reach from keywords, hashtags or posting times.

## 10.3 Profile optimisation

Once a month, recommend improvements to:
- LinkedIn headline.
- About section.
- Featured section.
- Skills and experience descriptions.
- Profile banner.
- Other social bios.

Suggestions must be grounded in Thess's actual experience and goals. Never invent credentials, employment history or results.

---

# 11. Feedback, memory and learning system

The application should learn from three distinct categories.

## 11.1 Preference learning

Inputs:
- Like/dislike rating.
- Explicit feedback.
- Rejected angle and reason.
- Format selection.
- Tone preference.
- Topics to avoid.
- Direct instructions such as "more of this" or "less formal".

## 11.2 Edit learning

Save:
- Original AI draft.
- User-edited version.
- Final approved version.
- Edit timestamp.
- Optional explanation of the edit.

Analyse recurring differences, such as:
- Shorter openings.
- More personal language.
- Less formal phrasing.
- More technical detail.
- Fewer hashtags.
- Different CTA style.

Do not assume every edit reflects a permanent preference. Some edits are specific to one post.

## 11.3 Performance learning

Capture platform-specific metrics where available:
- Impressions/reach.
- Reactions/likes.
- Comments.
- Saves.
- Shares/reposts.
- Clicks.
- Profile visits.
- Followers gained.
- Video views and watch time where available.

Record:
- Source of metric (manual, integration or imported report).
- Measurement date.
- Platform.
- Metric definition.
- Reporting window.

Compare like with like. Do not compare raw views across platforms as though they mean the same thing.

## 11.4 Learning rules

- Keep preference learning separate from performance learning.
- A low-performing post is not automatically a bad post.
- A high-performing post is not automatically worth repeating.
- Consider objective, audience relevance, format, timing, sample size and context.
- Do not overfit to one viral or poorly performing post.
- Show the user important inferred preference changes before making them permanent.
- Keep a version history of the voice guide and learning notes.

## 11.5 Weekly review

Before generating a new weekly plan:
- Review recent approved and rejected content.
- Review edits and direct feedback.
- Review recent performance data.
- Identify recurring successful patterns and weak patterns.
- Suggest learning updates.
- Use the updated guidance for the next plan.

Keep the active learning summary concise and traceable to its source records.

---

# 12. Audience growth and engagement assistant

## 12.1 Purpose

Support sustainable growth through useful participation and professional networking, not spam or engagement manipulation.

## 12.2 Daily/weekly recommendations

Recommend:
- Relevant industry conversations to join.
- Professionals and creators whose public work is relevant.
- Posts where Thess can contribute a meaningful comment.
- Questions worth answering.
- Topics gaining attention in her professional communities.
- Opportunities to share a practical example or point of view.
- Follow-up actions for genuine professional conversations.

## 12.2a Realistic limits

- Web search cannot reliably see the LinkedIn feed, and scraping LinkedIn breaks its terms. The assistant must not scrape LinkedIn or other platforms.
- Recommendations are therefore based on public web content, topics, communities, hashtags, events and people Thess names herself.
- Thess finds and checks the actual posts to comment on. The assistant can then help draft a thoughtful comment from text she pastes in.

## 12.3 Guardrails

- Do not mass-comment, mass-follow, scrape private information or automate unsolicited DMs.
- Do not generate fake engagement.
- Do not impersonate Thess or interact without explicit approval.
- Comments must add substance and be reviewed by Thess.
- Use public information and permitted platform access only.
- Respect platform terms, rate limits and privacy controls.

## 12.4 Growth dashboard

Track:
- Follower trend.
- Relevant audience signals, where available.
- Profile visits.
- Reach and engagement.
- Best-performing topics and formats.
- Meaningful conversations.
- Inbound opportunities.
- Experiments and outcomes.

Show trends and context, not unsupported promises of follower growth.

---

# 13. Confidentiality, privacy and safety

This is a hard requirement.

## 13.1 Public-content safety rules

The agent must not publish or expose:
- Employer or client names unless Thess explicitly confirms they are public and approved for use.
- Colleague, manager or customer identities.
- Internal project names.
- Internal dashboards, screenshots, documents or records.
- Non-public business figures, operational data or performance metrics.
- Credentials, API keys, tokens or personal identifiers.
- Proprietary workflows or commercially sensitive processes.
- Personal or confidential information about third parties.

## 13.2 Safe transformation

When Thess shares a work-related learning experience:
- Preserve the general technical lesson.
- Remove identifying business context.
- Replace real company examples with fictional or generic scenarios.
- Remove internal figures and identifiers.
- Avoid screenshots that reveal systems, URLs, records or customer data.
- Ask for clarification or approval if the risk cannot be resolved safely.

## 13.3 Confidentiality classification

Each input and draft should have a classification:
- Public.
- Personal/professional, safe to share after review.
- Restricted/internal.
- Confidential.
- Unknown — requires review.

Default uncertain content to **Unknown — requires review**.

## 13.4 Review flags

Every draft must include:
- `safety_status`: clear / needs_review / blocked.
- `safety_reasons`: list of detected issues.
- `needs_user_confirmation`: boolean.
- `review_notes`: plain-language explanation.

A blocked draft cannot be marked ready for publication until the underlying issue is resolved.

## 13.5 Security requirements

- Keep API keys server-side.
- Use least-privilege access.
- Enable Row Level Security on user data.
- Validate file uploads and restrict file types and sizes.
- Protect scheduled endpoints with secrets and authentication.
- Do not log full sensitive prompts or uploaded confidential content unnecessarily.
- Provide deletion/export controls for user content.
- Keep audit records for important changes and approvals.

---

# 14. Weekly planning and scheduled workflows

## 14.1 Weekly plan schedule

Default: every Sunday at 6:00 PM `Africa/Lagos`.

The schedule must be timezone-aware. Do not rely on an unexamined cron expression or assume the scheduler's timezone. If using a UTC-only scheduler, convert the local schedule explicitly and document the conversion.

Known conversion: `Africa/Lagos` is UTC+1 all year (no daylight saving). Sunday 18:00 WAT = Sunday 17:00 UTC = cron `0 17 * * 0` on a UTC scheduler. If the user changes the time in Settings, recompute the UTC cron and show both times in the UI.

The schedule should be configurable in Settings.

## 14.1a Step-based execution (avoid timeouts)

The weekly run involves research, planning and several drafts. Running it as one long serverless call risks hitting function time limits.

Run it as resumable steps recorded in `scheduled_jobs` / a `job_steps` table:
1. Load context.
2. Research news (one step).
3. Research calendar events (one step).
4. Score and plan.
5. Draft LinkedIn post 1, 2, 3 (one step each).
6. Draft adaptations (one step each).
7. Safety and quality checks.
8. Notify.

Each step:
- Saves its output before the next step starts.
- Can be retried on its own.
- Is idempotent (re-running does not duplicate records).
- Has a timeout and a clear failure state.

If a step fails after retries, the run continues where possible and the plan is marked partial with the reason shown.

## 14.2 Weekly planning workflow

1. Load brand settings, voice guide, active learnings and goals.
2. Load unused ideas and recent work/learning notes.
3. Load recent posts to avoid unnecessary repetition.
4. Review recent feedback and performance.
5. Research relevant developments from the previous 7 days.
6. Research upcoming events and awareness dates.
7. Score and rank candidate opportunities.
8. Prioritise Thess's own ideas and experiences where relevant.
9. Select three core LinkedIn posts with a balanced content mix.
10. Recommend suitable platform adaptations.
11. Recommend creative formats only when useful.
12. Draft content and retain research citations.
13. Run voice, factual, SEO and confidentiality checks.
14. Save the plan and drafts in `draft` status.
15. Notify Thess that the weekly plan is ready.
16. Record execution status, failures and token/API usage.

The system should never send an empty or fabricated weekly plan just to complete the scheduled run. If research fails, it should use available ideas and clearly mark research as incomplete.

## 14.3 Suggested weekly deliverables

- Three LinkedIn drafts.
- Selected Instagram adaptations.
- One or two Facebook adaptations where appropriate.
- Optional TikTok/Reels concepts and scripts based on suitable ideas.
- Suggested creative assets.
- A short weekly editorial summary.
- Research opportunities not selected, with reasons.
- Items requiring clarification or confidentiality review.

Do not force two video scripts every week. Video is recommended when it is the best format.

## 14.4 Notifications

V1: email notification when a weekly plan is ready and when a scheduled run fails.

**Posting-day reminders:** on each configured posting day (default Tue, Wed, Thu), send a short morning email (default 8:00 AM WAT) saying which post is planned for today, with a link to it. If nothing approved is planned for that day, say so and link to the board. Reminders can be turned off in Settings.

Notification content should link to the application. Avoid including sensitive draft content in email unless explicitly configured.

---

# 15. Application screens and user experience

## 15.1 Dashboard / Overview

Show:
- This week's plan.
- Posts awaiting review.
- New ideas.
- Research opportunities.
- Content published this month.
- Follower and performance summary.
- Suggested next actions.
- System/integration health.

## 15.2 Weekly Planner

Show content by day and platform.

Each card should show:
- Topic/hook.
- Pillar.
- Objective.
- Platform.
- Format.
- Status.
- Research/source indicator.
- Safety status.

Allow drag/reorder or date changes where practical.

## 15.3 Post Detail / Editor

Functions:
- View and edit copy.
- View platform variations.
- Copy text with line breaks preserved.
- Copy hashtags separately.
- Preview carousel/graphic/video script.
- View citations and research sources.
- Rate the draft and explain feedback.
- Save versions.
- Approve, reject, regenerate or request changes.
- Mark as published and add the live URL.
- Enter performance data.

## 15.4 Idea Inbox

Functions:
- Quick capture.
- File and image upload.
- Link capture.
- Idea status.
- AI analysis.
- Suggested angles and formats.
- Convert idea into draft.
- Search and filter.

## 15.5 AI Content Studio

A conversational workspace with access to the user's brand context and permitted knowledge records.

Example requests:
- "Turn this thought into a LinkedIn post."
- "Give me three different angles."
- "Make this sound more like me."
- "This should be a carousel instead."
- "Make it more technical but still accessible."
- "Create a short video script from this."
- "Have I posted about this topic before?"

The chat must save useful outputs as drafts or ideas when the user chooses. Do not silently overwrite existing content.

## 15.6 Industry Radar

Show:
- Recent research.
- Topic/category.
- Source and date.
- Why it matters.
- Suggested angle.
- Relevance score.
- Save to idea inbox.
- Dismiss/mark irrelevant.

## 15.7 Creative Studio

Show:
- Carousel editor and preview.
- Graphic templates.
- Photo library.
- Design brief.
- Export/download.
- Video script and storyboard.
- Optional Canva handoff/integration.

## 15.8 Knowledge Base

Manage:
- Brand profile.
- Skills and tools.
- Learning notes.
- Approved public project examples.
- Voice guide.
- Positive and negative examples.
- Topics already covered.
- Restricted knowledge categories.

## 15.9 Feedback Centre

Show:
- Approved/rejected drafts.
- Ratings and reasons.
- Before/after edits.
- Suggested preference learnings.
- Performance patterns.
- User confirmation for persistent learning updates.

## 15.10 Analytics & Growth

Show:
- Platform-level metrics.
- Follower trends.
- Content performance.
- Pillar/format comparisons.
- Top posts.
- Growth actions and outcomes.
- Manual metric entry.

## 15.11 Settings

Allow editing:
- Brand positioning.
- Audience priorities.
- Content pillars and mix.
- Platforms and handles.
- Posting days and times.
- Voice guide.
- Banned phrases.
- Keywords.
- Brand kit.
- Notification preferences, including posting-day reminders.
- Research topics and sources.
- AI provider/model configuration.
- Monthly AI budget cap.
- Writing samples and style references (voice seeding).
- Integrations.
- Data export and deletion.

---

# 16. Technical architecture

## 16.1 Recommended stack

| Layer | Recommended technology | Notes |
|---|---|---|
| Frontend | Next.js App Router + TypeScript | Responsive web application |
| UI | Tailwind CSS + accessible component library | Consistent design system |
| Backend | Next.js server routes/actions or dedicated server functions | Keep secrets server-side |
| Database | Supabase PostgreSQL | Relational data and JSON fields |
| Authentication | Supabase Auth | Single-owner access in v1 |
| File storage | Supabase Storage | Photos, uploads and exports |
| Retrieval | PostgreSQL full-text search; pgvector when useful | Do not add vector complexity before needed |
| AI provider | Anthropic API initially, behind provider adapter | Keep model/provider configurable |
| Research | Anthropic web search tool first, behind a search adapter; official sources/RSS where practical | Store citations and timestamps. Add a separate search API only if the built-in tool falls short |
| Scheduled jobs | Supabase Cron (or Vercel Cron) invoking a protected endpoint | Pick one scheduler and document it. Monitor job runs and failures |
| Hosting | Vercel or another supported host | Deploy early |
| Email | Resend or Supabase-supported email workflow | Notifications only |
| Version control | GitHub | Private repository recommended |

## 16.2 AI provider design

Create a provider abstraction so model changes do not require rewriting application logic.

Configuration:
- `AI_PROVIDER`
- `AI_MODEL`
- `AI_FALLBACK_MODEL` (optional)
- Provider API key in server-only environment variables.

Do not hardcode an unverified model identifier. At setup time, verify model availability and tool support using the provider's current documentation or Models API.

Use a cost-effective model for routine classification and extraction where quality is sufficient. Use a stronger model for research synthesis, strategic planning and final content generation when needed.

The app should record model, token usage, latency, errors and estimated cost where the provider exposes the necessary data.

## 16.3 Agent architecture

Use a central orchestrator and small, testable workflows. These can initially be implemented as modules/functions rather than separate autonomous agents.

Core roles:

1. **Brand Strategist:** checks positioning, audience, objectives and content mix.
2. **Research Agent:** discovers and verifies relevant developments.
3. **Content Planner:** ranks opportunities and creates the weekly plan.
4. **LinkedIn Writer:** creates the primary professional post.
5. **Repurposing Writer:** adapts approved ideas for other platforms.
6. **Creative Director:** creates design briefs, carousel data and video storyboards.
7. **Safety Reviewer:** checks confidentiality, claims and sensitive content.
8. **Feedback Analyst:** extracts preference learnings and performance insights.
9. **Growth Analyst:** recommends useful engagement and audience-growth actions.

Do not introduce autonomous multi-agent handoffs unless they solve a demonstrated problem. Use deterministic application workflows wherever possible.

## 16.4 Agent output contracts

Use structured JSON outputs validated with Zod or an equivalent schema.

Every generated content record should include:
- `title`
- `platform`
- `pillar`
- `objective`
- `format`
- `audience`
- `hook`
- `body`
- `cta`
- `keywords`
- `hashtags`
- `source_ids`
- `creative_brief`
- `safety_status`
- `safety_reasons`
- `needs_user_confirmation`
- `generation_metadata`

If output validation fails, retry safely or show an actionable error. Do not save malformed output as a ready draft.

## 16.5 Integration adapters

Create independent adapters for:
- Search/research.
- Canva.
- Metricool or another publishing/analytics provider.
- Email notifications.
- Optional transcription service.

Each adapter must have:
- Capability check.
- Authentication handling.
- Error handling.
- Rate-limit handling.
- Logging without exposing secrets.
- Manual fallback.
- Connection status.

**Metricool:** investigate the current API access, plan requirements, scopes and supported channels before implementation. Do not assume every account can publish or retrieve all analytics through an API. V1 must work without Metricool.

Metricool API access is likely limited to higher paid plans. Confirm before planning around it.

**Canva:** use approved Canva developer APIs/MCP capabilities where account eligibility and permissions allow. A Canva handoff or downloadable design brief is an acceptable fallback. Confirm plan requirements before promising automated template autofill. Canva's Autofill API has historically required a Canva Enterprise plan; verify current requirements. The in-app carousel renderer (Phase 3) is the primary design path and must not depend on Canva.

---

# 17. Database design

Use migrations and foreign keys. Add `created_at` and `updated_at` where appropriate. Use UUID primary keys unless a strong reason exists otherwise.

Suggested tables:

## 17.1 User and brand

### `profiles`
- id
- owner_email
- display_name
- timezone
- created_at
- updated_at

### `brand_settings`
- id
- profile_id
- positioning
- professional_bio
- audience_priorities (jsonb)
- goals (jsonb)
- platforms (jsonb)
- posting_schedule (jsonb)
- keyword_library (jsonb)
- banned_phrases (jsonb)
- brand_kit (jsonb)
- notification_preferences (jsonb) — includes posting-day reminder days/time
- monthly_ai_budget (numeric, USD)
- created_at
- updated_at

### `brand_knowledge`
- id
- profile_id
- category
- title
- content
- proficiency_level
- visibility_classification
- source_type
- source_reference
- active
- created_at
- updated_at

## 17.2 Voice and learning

### `voice_guides`
- id
- profile_id
- version
- guide_content
- change_summary
- active
- created_at

### `learning_notes`
- id
- profile_id
- learning_type (preference / edit_pattern / performance / direct_instruction)
- note
- evidence_count
- source_record_ids (jsonb)
- confidence
- active
- created_at
- updated_at

### `feedback`
- id
- post_id
- rating
- reason_category
- comment
- created_at

## 17.3 Ideas and research

### `ideas`
- id
- profile_id
- raw_content
- input_type
- source_url
- asset_id
- topic_tags (jsonb)
- platform_hint
- format_hint
- confidentiality_classification
- status
- created_at
- updated_at

### `research_items`
- id
- profile_id
- title
- publisher
- canonical_url
- published_at
- discovered_at
- category
- summary
- relevance_reason
- suggested_angle
- reliability_status
- verification_notes
- expires_at
- created_at

### `calendar_events`
- id
- profile_id
- event_date
- name
- category
- geography
- source_url
- relevance_reason
- verified
- created_at

## 17.4 Planning and content

### `weekly_plans`
- id
- profile_id
- week_start
- timezone
- summary
- status
- research_status
- generated_at
- created_at

### `posts`
- id
- profile_id
- weekly_plan_id
- source_idea_id
- parent_post_id
- platform
- pillar
- objective
- format
- scheduled_for
- hook
- body
- cta
- keywords (jsonb)
- hashtags (jsonb)
- source_ids (jsonb)
- creative_brief (jsonb)
- carousel_data (jsonb)
- video_data (jsonb)
- safety_status
- safety_reasons (jsonb)
- status
- approved_at
- published_at
- published_url
- created_at
- updated_at

### `post_versions`
- id
- post_id
- version_number
- body
- structured_content (jsonb)
- changed_by
- change_note
- created_at

### `post_assets`
- id
- post_id
- asset_id
- role
- sort_order
- created_at

## 17.5 Assets and analytics

### `assets`
- id
- profile_id
- storage_path
- file_name
- mime_type
- file_size
- asset_type
- description
- tags (jsonb)
- usage_classification
- created_at

### `post_metrics`
- id
- post_id
- platform
- metric_name
- metric_value
- metric_unit
- measurement_source
- measured_at
- reporting_window
- created_at

### `growth_actions`
- id
- profile_id
- action_type
- target_url
- recommendation
- status
- outcome
- created_at
- completed_at

## 17.6 System and operations

### `chat_sessions`
- id
- profile_id
- title
- created_at
- updated_at

### `chat_messages`
- id
- session_id
- role
- content
- related_record_ids (jsonb)
- created_at

### `integration_connections`
- id
- profile_id
- provider
- connection_status
- scopes (jsonb)
- last_checked_at
- metadata (jsonb)

Do not store raw OAuth secrets in ordinary application tables. Use secure server-side secret storage.

### `scheduled_jobs`
- id
- job_type
- scheduled_for
- status
- started_at
- completed_at
- error_summary
- metadata (jsonb)

### `job_steps`
- id
- job_id
- step_name
- step_order
- status (pending / running / done / failed / skipped)
- attempts
- output_ref (jsonb)
- error_summary
- started_at
- completed_at

### `usage_logs`
- id
- task_type
- provider
- model
- input_tokens
- output_tokens
- estimated_cost
- latency_ms
- status
- created_at

## 17.7 Database rules

- Enable RLS on all user-owned tables.
- In v1, only the authenticated owner can access their records.
- Use server-side privileged access only where required.
- Validate all data at API boundaries.
- Index common lookups: profile, week, status, platform, topic and created date.
- Keep raw ideas and post versions; do not overwrite source material.
- Store source URLs and provenance for research-derived content.
- Use migrations, not manual undocumented production changes.

---

# 18. API routes and application services

Use clear service boundaries. Suggested routes (adapt to the chosen Next.js structure):

- `POST /api/ideas` — create an idea.
- `GET /api/ideas` — list/search ideas.
- `POST /api/ideas/:id/analyse` — analyse and suggest angles.
- `POST /api/content/generate` — generate a draft.
- `POST /api/content/:id/regenerate` — regenerate with instructions.
- `PATCH /api/posts/:id` — update draft.
- `POST /api/posts/:id/approve` — approve a draft.
- `POST /api/posts/:id/feedback` — record feedback.
- `POST /api/posts/:id/publish-record` — mark manually published and save URL.
- `POST /api/plans/generate` — generate a weekly plan.
- `GET /api/research` — list research items.
- `POST /api/research/run` — run research.
- `POST /api/metrics` — record metrics.
- `POST /api/jobs/weekly-plan` — protected scheduled job endpoint.
- `GET /api/health` — application/integration health.

These are proposed interfaces, not a requirement to create every route in the first milestone. Validate request and response schemas.

---

# 19. Security, reliability and cost controls

## 19.1 Security

- Authentication required for every private route.
- Owner-only access in v1.
- RLS enabled.
- Secrets stored in deployment environment variables or secure vault.
- Never expose service-role keys to the browser.
- Validate uploads and restrict file sizes/types.
- Protect cron endpoints against unauthorised calls and replay where appropriate.
- Sanitize user content before rendering.
- Keep third-party integrations least-privilege.
- Never commit `.env` files or credentials.

## 19.2 Reliability

- Scheduled jobs must be idempotent: rerunning a job must not create duplicate weekly plans or posts.
- Add retry limits and clear failure states.
- Track job execution and integration health.
- Provide a manual "Generate this week's plan" action.
- Preserve drafts when an external provider fails.
- Do not silently discard failed research or generation steps.
- Add timeouts and rate-limit handling.

## 19.3 Cost management

- Record AI usage by task and model.
- Allow model selection/configuration.
- Use cheaper models for routine classification where suitable.
- Limit research calls and duplicate searches.
- Cache reusable research results when appropriate.
- Avoid sending the entire knowledge base to the model on every request; retrieve relevant records.
- Show estimated usage/cost where possible.
- API billing is separate from a consumer AI subscription unless the provider explicitly states otherwise.

## 19.4 Monthly budget cap

- Setting: `monthly_ai_budget` (in USD), set by Thess.
- Show month-to-date estimated spend on the dashboard.
- At 80% of budget: email a warning.
- At 100%: pause non-essential AI calls (research, regeneration, chat) and email Thess. Manual "continue anyway" override in Settings.
- The cap uses estimated cost from `usage_logs`; label it as an estimate.

---

# 20. MVP scope and phased delivery

## Phase 0 — Project foundation

Deliver:
- Repository review.
- Architecture decision record.
- Next.js/TypeScript setup.
- Supabase project and migrations.
- Owner authentication.
- Basic responsive layout.
- Deployment pipeline.
- Environment configuration.
- Basic tests and README.

Acceptance:
- Only the owner can sign in.
- Private routes are protected.
- Database access is restricted by RLS.
- App deploys successfully.
- No secrets are exposed client-side.

## Phase 1a — Fast first use (target: about one week after Phase 0)

Goal: Thess can start posting with the tool quickly while the full Phase 1 is built.

Deliver:
- Simple Settings: positioning, audience, pillars, banned phrases, keywords (plain form fields).
- Voice seeding (Section 5.5) and voice guide v1.
- Idea Inbox: quick text capture, including learning notes and the standard prompt (Section 8.5).
- Thought-to-content: LinkedIn draft + 2 alternative hooks + format recommendation + hashtags.
- Basic safety check with `safety_status` and plain-language notes.
- This Week board: list of drafts by day.
- Copy button (line breaks preserved) and separate hashtag copy.
- 👍/👎 rating with optional reason.
- Manual "Generate this week's plan" button using ideas only (no research yet).

Acceptance:
- Thess can paste a thought or learning note and get a usable LinkedIn draft in her voice.
- She can copy it cleanly into LinkedIn.
- Ratings are stored.
- Original ideas are preserved.

Everything else in Phase 1 extends this, not replaces it.

## Phase 1 — Brand intelligence and core content engine

**This is the first complete product.**

Deliver:
- Brand profile and settings.
- Content pillars and audience goals.
- Editable voice guide.
- Knowledge base.
- Idea Inbox.
- Thought-to-content generation.
- LinkedIn-first drafting.
- Alternative hooks and format recommendations.
- Source references for researched claims.
- Safety review flags.
- This Week board.
- Post editing, copy, approval and version history.
- Feedback ratings and direct instructions.

Acceptance:
- Thess can submit a rough thought and receive a relevant draft.
- The draft reflects saved brand context and voice guidance.
- The system can recommend a suitable format and explain why.
- Original ideas are preserved.
- Feedback and edits are stored.
- Drafts cannot be marked ready if blocked by safety checks.
- User can manually create a weekly plan.

## Phase 2 — Research and weekly intelligence

Deliver:
- Industry Radar.
- Configurable research topics and source list.
- Recent-news discovery.
- Awareness-day/event research.
- Relevance scoring.
- Research citations and verification status.
- Automated weekly planning (step-based, Section 14.1a).
- Sunday notification.
- Posting-day reminders.
- Job execution history and retry controls.
- Monthly budget cap (Section 19.4).

Acceptance:
- Research records retain source URLs and dates.
- Old news is not presented as new.
- The weekly planner creates three core LinkedIn drafts when sufficient material exists.
- Research failure is visible and does not destroy the plan.
- Re-running a scheduled job does not create duplicates.

## Phase 3 — Creative Studio

Deliver:
- Carousel data schema.
- 4–5 branded templates.
- Carousel preview.
- PNG/JPEG export.
- PDF export.
- Photo library and photo slots.
- Graphic briefs.
- Video scripts and storyboards.

Acceptance:
- Carousel layouts are readable and consistent.
- Text does not overflow slide boundaries.
- Exports have correct dimensions.
- User can preview before download.
- Original content remains editable.

## Phase 4 — Analytics and learning

Deliver:
- Manual post metrics.
- Platform-specific metric definitions.
- Performance dashboard.
- Preference-learning summaries.
- Edit-difference analysis.
- Monthly content review.
- Profile optimisation recommendations.

Acceptance:
- Manual and imported metrics are clearly distinguished.
- Comparisons use compatible metrics and time windows.
- Learning recommendations show supporting evidence.
- Persistent voice changes require explicit confirmation or repeated evidence.

## Phase 5 — Integrations and growth assistant

Deliver, subject to API access and account eligibility:
- Canva integration or handoff.
- Metricool/publishing provider integration.
- Optional scheduling after user approval.
- Platform analytics import where supported.
- Daily/weekly growth actions.
- Relevant conversation recommendations.

Acceptance:
- Integration failure does not break content creation.
- No content is published without explicit approval.
- OAuth credentials and scopes are handled securely.
- Unsupported API actions are clearly disclosed.
- Manual workflows remain available.

## Later enhancements (not v1)

- AI avatar/talking-photo videos.
- WhatsApp/Telegram idea capture.
- Browser extension.
- Automatic LinkedIn metrics where permitted.
- Advanced competitor analysis.
- Multi-brand/multi-user support.
- Monthly PDF performance report.
- Automated publishing without per-post approval (only if explicitly requested and platform-compliant).

---

# 21. Build order for Claude Code

Build one milestone at a time.

1. Inspect repository and confirm implementation plan.
2. Create project scaffold and design system.
3. Configure Supabase and owner-only authentication.
4. Create database migrations and RLS policies.
5. **Phase 1a:** simple Settings, voice seeding, AI provider adapter with structured output validation, Idea Inbox (text + learning notes), thought-to-content, basic safety check, This Week board, copy buttons, ratings, manual weekly plan from ideas.
6. Expand Brand Settings and build the Knowledge Base.
7. Add file, image and link capture to the Idea Inbox.
8. Implement brand-context retrieval and the versioned voice guide.
9. Expand thought-to-content (angles, clarification question, full safety schema, sources).
10. Build post editor, versions, feedback and approval states.
11. Build full weekly planner and dashboard.
12. Add research adapter (Anthropic web search first) and Industry Radar.
13. Add step-based scheduled weekly plan, notifications, posting-day reminders and budget cap.
14. Build carousel/creative rendering.
15. Add metrics and feedback learning.
16. Add optional integrations.
17. Complete end-to-end tests and security review.
18. Write the three project documents:
    - **Project Brief:** what the app is, goals, scope, architecture summary, phases.
    - **SOP:** how Thess uses it week to week (Sunday review, posting days, adding ideas and learning notes, rating, entering metrics).
    - **Handover Note:** how it is built and deployed, environment variables, scheduled jobs, where data lives, common problems and fixes, how to change the model or budget.

Explain every report in simple, plain English. When Thess needs to do something (create an account, copy a key, click a setting), give numbered step-by-step instructions.

At the end of each milestone, Claude Code must report:
- What was built.
- Files changed.
- Database changes.
- Environment variables required.
- How to run it.
- How to test it.
- Known limitations.
- Next recommended milestone.

Do not move to the next milestone until the current one passes its acceptance criteria.

---

# 22. Testing requirements

Minimum test coverage:

## Unit tests
- Content schema validation.
- Platform adaptation logic.
- Content scoring.
- Timezone conversion.
- Confidentiality classification rules.
- Metric calculations.
- Duplicate weekly-plan prevention.

## Integration tests
- Authentication and RLS.
- Idea creation and retrieval.
- AI provider failure handling.
- Structured output validation.
- Post version saving.
- Feedback recording.
- Scheduled job authentication.
- File upload validation.

## End-to-end tests
1. Sign in as owner.
2. Add a rough idea.
3. Analyse the idea.
4. Generate a LinkedIn post.
5. Review sources and safety flags.
6. Edit and save a version.
7. Approve the draft.
8. Copy the post.
9. Mark it manually published.
10. Enter performance metrics.
11. Confirm feedback and learning records.
12. Generate a weekly plan.
13. Simulate a research/API failure and verify graceful handling.

Use fictional test data. Never use confidential work records in test fixtures.

---

# 23. Initial environment variables

Names may be adapted to the selected SDK and deployment setup.

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=
AI_PROVIDER=anthropic
AI_MODEL=

# Optional — only if the Anthropic web search tool is not enough
SEARCH_API_KEY=

RESEND_API_KEY=
OWNER_EMAIL=

CRON_SECRET=

CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=

METRICOOL_API_KEY=
```

Only add provider-specific variables when that integration is implemented and its current authentication method is confirmed.

Do not assume Metricool uses a particular authentication flow or that a key is available to every account. Confirm current documentation and access first.

Never prefix private secrets with `NEXT_PUBLIC_`.

---

# 24. Open decisions and configuration checklist

These can be completed during setup. Do not block the core MVP on visual preferences.

- [ ] Confirm final public-facing professional headline.
- [ ] Confirm priority between recruiter visibility and consulting leads (both are currently supported).
- [ ] Confirm social handles and profile URLs.
- [ ] Choose personal content series tag, if any (e.g. `#ThessBuilds`).
- [ ] Supply brand colours and fonts.
- [ ] Select profile photos and approved photo library assets.
- [ ] Confirm preferred posting days and times.
- [ ] Confirm notification email.
- [ ] Confirm research topics to prioritise.
- [ ] Confirm which tools are current expertise versus currently learning.
- [ ] Confirm whether Canva and Metricool accounts/plans support the required integrations.
- [ ] Confirm final AI model after checking live provider availability and cost.
- [ ] Provide 5–10 writing samples that sound like Thess (plus optional 2–3 style references).
- [ ] Set the monthly AI budget cap (USD).
- [ ] Confirm posting-day reminder days and time (default Tue/Wed/Thu, 8:00 AM WAT).

---

# 25. Definition of done for the first usable release

The MVP is ready when Thess can:

1. Sign in securely.
2. Configure her professional identity, audience and content pillars.
3. Add professional knowledge and approved examples.
4. Drop a rough thought, learning or link into the Idea Inbox.
5. Receive a well-structured LinkedIn draft in her voice.
6. See alternative angles and a recommended format.
7. Review factual sources and confidentiality flags.
8. Edit, copy, approve or reject the draft.
9. See three planned LinkedIn posts in a weekly board.
10. Adapt selected content for other platforms.
11. Rate drafts and explain what worked or did not.
12. Preserve original and edited versions.
13. Run a weekly plan manually, even if scheduled jobs are unavailable.

**The MVP does not need automatic publishing, AI avatars, advanced competitor scraping or complex multi-agent autonomy to be useful.**

The first release succeeds when it consistently turns Thess's ideas and professional learning into thoughtful, credible, review-ready content.

---

# 26. Technical references to verify during implementation

Use official documentation and re-check current API versions, pricing, account eligibility and model availability before coding integrations.

- Anthropic API overview: https://platform.claude.com/docs/en/api/overview
- Anthropic Models API: https://platform.claude.com/docs/en/api/models
- Anthropic web search tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
- Supabase Cron: https://supabase.com/docs/guides/cron
- Supabase scheduled Edge Functions: https://supabase.com/docs/guides/functions/schedule-functions
- Canva Developers: https://www.canva.dev/docs/
- Canva Autofill API: https://www.canva.dev/docs/apps/rest-apis/reference/autofills/
- Metricool: https://metricool.com/

**Implementation note:** model names, search tool versions, API access, plan restrictions, scopes and rate limits change. Verify them at build time. Do not treat this reference list as a guarantee that every integration is enabled for the user's account.
