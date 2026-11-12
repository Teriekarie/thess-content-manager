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

export function buildLinkedInPrompt(input: {
  idea: string;
  inputType: "thought" | "learning_note";
  tone: Tone;
  recentTitles: string[];
}): string {
  return `Write a LinkedIn post, in "linkedin", from the author's ${input.inputType === "learning_note" ? "learning note" : "rough thought"} below.

<idea>
${input.idea}
</idea>

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
