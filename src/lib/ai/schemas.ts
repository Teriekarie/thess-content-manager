import { z } from "zod";

const safety = {
  safety_status: z
    .enum(["clear", "needs_review", "blocked"])
    .describe("clear unless the draft names a real employer, client, colleague, internal project or non-public figure"),
  safety_reasons: z.array(z.string()).describe("Empty when clear"),
  review_notes: z.string().describe("One plain sentence for the author. Empty when clear."),
  needs_user_confirmation: z.boolean(),
};

export const LinkedInDraftSchema = z.object({
  title: z.string().describe("Short working title, not part of the post"),
  hook: z.string().describe("The opening line of the post"),
  body: z.string().describe("The complete post including the opening line, with blank lines between paragraphs. No hashtags."),
  alt_hooks: z.array(z.string()).describe("Exactly two alternative opening lines"),
  cta: z.string().nullable().describe("A closing call to action, only if it suits the post"),
  pillar: z.string().describe("One of the author's content pillars, copied exactly"),
  objective: z.string(),
  tone: z.string().describe("The tone actually used, in a few words"),
  length: z.enum(["short", "long"]),
  format: z.string().describe("Recommended format, e.g. Text post, Carousel, Short video"),
  format_reason: z.string().describe("One sentence on why this format fits"),
  keywords: z.array(z.string()).describe("3-6 search keywords worked naturally into the post"),
  hashtags: z.array(z.string()).describe("0-5 relevant hashtags"),
  clarifying_question: z
    .string()
    .nullable()
    .describe("One short question whose answer would make the post stronger, or null"),
  ...safety,
});
export type LinkedInDraft = z.infer<typeof LinkedInDraftSchema>;

export const SocialDraftSchema = z.object({
  title: z.string(),
  body: z.string().describe("The caption, shorter and more visual than LinkedIn. No hashtags."),
  format: z.string().describe("e.g. Carousel, Single image, Photo-led caption, Reel"),
  format_reason: z.string(),
  cover_text: z.string().nullable().describe("Text for the image or first slide, if any"),
  keywords: z.array(z.string()),
  hashtags: z.array(z.string()).describe("0-8 relevant hashtags"),
  ...safety,
});
export type SocialDraft = z.infer<typeof SocialDraftSchema>;

/** One request that returns the LinkedIn post and its Instagram + Facebook caption together. */
export const CombinedDraftSchema = z.object({
  linkedin: LinkedInDraftSchema,
  instagram_facebook: SocialDraftSchema,
});
export type CombinedDraft = z.infer<typeof CombinedDraftSchema>;

export const TikTokDraftSchema = z.object({
  title: z.string(),
  hook: z.string().describe("What is said in the first seconds"),
  body: z.string().describe("The full spoken script"),
  beats: z.array(z.string()).describe("3-5 content beats"),
  on_screen_text: z.array(z.string()),
  shots: z.array(z.string()).describe("Suggested shots or screen recordings"),
  caption: z.string(),
  duration_seconds: z.number(),
  keywords: z.array(z.string()),
  hashtags: z.array(z.string()),
  ...safety,
});
export type TikTokDraft = z.infer<typeof TikTokDraftSchema>;

export const VoiceGuideSchema = z.object({
  guide: z.string().describe("The voice guide in plain text with short headed sections"),
  summary: z.string().describe("Two sentences describing the voice"),
});
export type VoiceGuideDraft = z.infer<typeof VoiceGuideSchema>;

export const TrendingIdeasSchema = z.object({
  ideas: z.array(
    z.object({
      topic: z.string().describe("What is being discussed, in one plain sentence, with its date if known"),
      angle: z.string().describe("A question or angle the author could respond to. Do not write her opinion for her."),
      tone: z.enum(["funny", "opinion", "school_of_thought", "serious"]),
      source_url: z.string().describe("Copied exactly from the provided source list"),
    }),
  ),
});
export type TrendingIdeas = z.infer<typeof TrendingIdeasSchema>;

export const EventsSchema = z.object({
  events: z.array(
    z.object({
      date: z.string().describe("YYYY-MM-DD, exactly as confirmed by a source"),
      name: z.string(),
      category: z.enum(["public_holiday", "tech_observance", "tech_event", "cultural", "global"]),
      geography: z.string().describe("e.g. Nigeria, Global"),
      relevance_reason: z.string().describe("One sentence on why it suits this author"),
      suggested_angle: z.string().describe("One sentence post angle. No invented personal stories."),
      source_url: z.string().describe("Copied exactly from the provided source list"),
    }),
  ),
});
export type EventList = z.infer<typeof EventsSchema>;
