import { TONES, type Tone } from "@/lib/content/defaults";

export type BrandContext = {
  positioning: string;
  bio: string;
  audience: string[];
  pillars: string[];
  keywords: string[];
  bannedPhrases: string[];
  voiceGuide: string | null;
};

const list = (items: string[]) => (items.length ? items.map((i) => `- ${i}`).join("\n") : "- (none set)");

/** The stable part of every writing request: who the author is and how she writes. */
export function buildSystemPrompt(brand: BrandContext): string {
  return `You write social media content for one person, the author, who reviews and posts everything herself. You are her writing partner, not a marketing agency.

<author>
Positioning: ${brand.positioning || "(not set)"}
Bio: ${brand.bio || "(not set)"}
Based in Nigeria.
</author>

<audience>
${list(brand.audience)}
</audience>

<content_pillars>
${list(brand.pillars)}
</content_pillars>

<keyword_library>
${list(brand.keywords)}
</keyword_library>

<voice>
${brand.voiceGuide ?? "No voice guide has been approved yet. Write in clear, natural, everyday English: warm, thoughtful and direct; professional without sounding corporate; confident but not boastful; occasionally witty; comfortable admitting uncertainty."}
</voice>

<writing_rules>
- One central idea per post. Start with a specific opening, never clickbait.
- Short paragraphs with blank lines between them, easy to read on a phone.
- Sound like a knowledgeable person sharing a real thought. Humour, opinion and a point of view are welcome; the post does not have to be serious.
- Preserve the author's point of view. Do not invent a stronger opinion than she gave.
- Never invent anecdotes, project results, statistics, quotes, clients, employers or credentials. Use only what the author supplied. If a real detail would help and is missing, write the post without it and ask for it in clarifying_question.
- Do not claim expert-level skill in a tool just because it is mentioned.
- Work 3-6 search keywords naturally into the opening and body so the post is easy to find. Never stuff keywords. Make the topic clear in the first line.
- Hashtags only when relevant, never more than asked for, and never inside the body.
- At most one emoji, and only if it truly fits. Avoid repeated dashes, engagement bait ("Comment YES"), manufactured controversy and fake vulnerability.
- Use British spelling.
- Never use these phrases:
${list(brand.bannedPhrases)}
</writing_rules>

<quiet_safety_check>
The author does not share confidential material, so expect safety_status "clear". Only use "needs_review" if the draft would name a real employer, client, colleague, customer or internal project, or reveal a non-public figure. In that case rewrite it generically and say what you changed in review_notes. Use "blocked" only for credentials or personal data about other people.
</quiet_safety_check>`;
}

export function toneInstruction(tone: Tone): string {
  switch (tone) {
    case "funny":
      return "Tone: light and funny. Relatable, witty, human. The humour must come from the real observation, not from invented events.";
    case "opinion":
      return "Tone: the author's own opinion, stated plainly and kindly.";
    case "school_of_thought":
      return "Tone: a school of thought. Lay out a way of thinking about the subject and why it is useful.";
    case "serious":
      return "Tone: practical and serious. Clear, useful, grounded.";
    default:
      return `Tone: choose whichever of these suits the idea best: ${Object.values(TONES).slice(1).join(", ")}.`;
  }
}

export type IdeaType = "thought" | "learning_note" | "trending" | "event";

const IDEA_KIND: Record<IdeaType, string> = {
  thought: "the author's rough thought",
  learning_note: "the author's learning note",
  trending: "the suggested topic",
  event: "the occasion",
};

export function buildLinkedInPrompt(input: {
  idea: string;
  inputType: IdeaType;
  tone: Tone;
  recentTitles: string[];
  research?: string | null;
  revision?: { currentPost: string; question: string; answer: string } | null;
}): string {
  return `Write a LinkedIn post, in "linkedin", from ${IDEA_KIND[input.inputType]} below.

<idea>
${input.idea}
</idea>
${
  input.inputType === "trending"
    ? "\nThis topic was suggested from current news, so it is not the author's own words. Do not claim she has personal experience of it or put an opinion in her mouth. Write it as a clear, useful take that she can adjust, and use clarifying_question to ask for her own view.\n"
    : ""
}${
  input.inputType === "event"
    ? "\nThis post marks the occasion above on its date. Tie it genuinely to the author's field or audience in a warm, human way. Do not invent personal memories, traditions or plans for her. Keep it short. Use clarifying_question to ask for one personal detail she might add.\n"
    : ""
}${
  input.research
    ? `\n<current_context note="Found by a live web search today. Use it to keep the post current. Only state a fact from it if it is clearly reported there, and never invent details beyond it. Hashtags seen in use may inform your hashtag choice.">\n${input.research}\n</current_context>\n`
    : ""
}${
  input.revision
    ? `\n<previous_draft>\n${input.revision.currentPost}\n</previous_draft>\n\nYou asked the author: "${input.revision.question}"\nShe answered: "${input.revision.answer}"\n\nRewrite the post using her answer. Keep what already worked. Use only the details she gave. Set clarifying_question to null unless something essential is still missing.\n`
    : ""
}
${toneInstruction(input.tone)}

Choose short or long form to suit the idea, and set "length" accordingly. Recommend the best format and explain why in one sentence. Give exactly two alternative opening lines that take a different angle from the main one. Pick the pillar from the author's list.

Then, in "instagram_facebook", adapt that same post into ONE caption that will be posted on both Instagram and Facebook. Keep the central message. Make it shorter, more visual and more conversational. Do not copy the LinkedIn text sentence for sentence. Recommend a format and, if an image or carousel would help, give the cover text.
${input.recentTitles.length ? `\nRecent posts, to avoid repeating an angle:\n${list(input.recentTitles)}` : ""}`;
}

export function buildSocialPrompt(linkedInBody: string): string {
  return `Adapt the LinkedIn post below into ONE caption that will be posted on both Instagram and Facebook.

<linkedin_post>
${linkedInBody}
</linkedin_post>

Keep the central message. Make it shorter, more visual and more conversational. Do not copy the LinkedIn text sentence for sentence. Recommend a format and, if an image or carousel would help, give the cover text.`;
}

export function buildTikTokPrompt(linkedInBody: string): string {
  return `Turn the LinkedIn post below into a short TikTok video script the author records herself.

<linkedin_post>
${linkedInBody}
</linkedin_post>

Keep the central message. Give a strong spoken opening, the full spoken script, 3-5 beats, on-screen text, suggested shots or screen recordings, a caption and a realistic duration in seconds.`;
}

export function buildVoiceGuidePrompt(samples: string[], styleReferences: string[]): string {
  return `Write a voice guide for the author, based on her own writing samples below. The guide will be given to a writer so drafts sound like her.

<writing_samples>
${samples.map((s, i) => `<sample index="${i + 1}">\n${s}\n</sample>`).join("\n")}
</writing_samples>
${
  styleReferences.length
    ? `\n<style_references note="Other people's posts the author likes. Learn the style only. Never copy sentences.">\n${styleReferences
        .map((s, i) => `<reference index="${i + 1}">\n${s}\n</reference>`)
        .join("\n")}\n</style_references>\n`
    : ""
}
Describe what you actually observe: sentence length and rhythm, vocabulary, how she opens and closes, how she uses humour, how personal she gets, punctuation habits, and things she never does. Use short headed sections and concrete do and don't examples drawn from the samples. Keep it under 500 words. Do not invent traits the samples do not show.`;
}

export function buildResearchQuestion(idea: string, today: string): string {
  return `Today is ${today}. Search the web for what is recent (roughly the last 30 days) and relevant to the topic of this idea, written by a professional who works in AI, automation and data:

<idea>
${idea}
</idea>

Report in under 180 words:
- 2 to 4 short notes on recent developments, announcements or discussions, each with its date.
- Hashtags you saw in actual use for this topic on public pages (only ones you saw).
If nothing recent and relevant turns up, say so plainly. Do not pad. Do not present old news as new.`;
}

export const TRENDING_AREAS = [
  "AI models, agents and AI at work (any company)",
  "Workflow automation and no-code or low-code tools",
  "Data analytics, dashboards and business intelligence",
  "Careers, hiring and skills in tech",
  "Major technology and business news worldwide",
  "Tech and business news from Nigeria and Africa",
  "Funny or relatable moments of working life and office technology",
];

export function buildTrendingQuestion(today: string): string {
  return `Today is ${today}. Search the web for what people are discussing this week across ALL of these areas. Run separate searches for different areas:
${list(TRENDING_AREAS)}

List 7 to 9 items, with at least one from each area where something recent exists. No more than two items may be about the same company or product. For each give one plain sentence on what is being discussed and its date. Skip anything older than about two weeks.`;
}

export function buildTrendingIdeasPrompt(notes: string, sources: { title: string; url: string }[]): string {
  return `From the research notes below, suggest 4 or 5 post topics for the author.

<research_notes>
${notes}
</research_notes>

<sources>
${sources.map((s) => `- ${s.title}: ${s.url}`).join("\n")}
</sources>

Each suggestion needs a topic, an angle phrased as a question she could answer in her own words, a fitting tone (include at least one light or funny one when the notes allow), and the source_url copied exactly from the list above. Only suggest topics that appear in the notes.\n\nMake them as varied as the notes allow: each from a different subject area, a mix of worldwide and African stories, and never two suggestions about the same company, product or event.`;
}

export function buildEventsQuestion(today: string, until: string): string {
  return `Today is ${today}. Search the web for dates between ${today} and ${until} in these groups:
- Nigerian public holidays and major cultural occasions.
- International days about technology, AI, data, cybersecurity, digital inclusion, women in tech and work.
- Major technology conferences and product events.
- Widely marked global occasions.

List each with its exact date and the page that confirms it. Only include dates you found confirmed on a page. Note when a holiday's date is still provisional (for example, dates set by moon sighting).`;
}

export function buildEventsPrompt(notes: string, sources: { title: string; url: string }[], today: string, until: string): string {
  return `From the research notes below, list the dates between ${today} and ${until} that are worth a post for the author.

<research_notes>
${notes}
</research_notes>

<sources>
${sources.map((s) => `- ${s.title}: ${s.url}`).join("\n")}
</sources>

Include public holidays and occasions she would naturally greet her audience on, and tech dates with a real link to her field. Leave out unrelated awareness days. Use only dates stated in the notes, in YYYY-MM-DD form, and copy each source_url exactly from the list. At most 12.`;
}

export function buildCarouselPrompt(postBody: string): string {
  return `Turn the post below into the text for a carousel of slides.

<post>
${postBody}
</post>

Give a cover headline, 4 to 6 content slides with one point each, and a closing slide. Keep every slide short enough to read at a glance. Use only what the post says. Do not add facts, numbers or examples that are not in it.`;
}
