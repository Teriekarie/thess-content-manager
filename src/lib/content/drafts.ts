import type { CarouselDraft, LinkedInDraft, SocialDraft, TikTokDraft } from "@/lib/ai/schemas";
import { findBannedPhrases, normaliseHashtags } from "./text";

const clean = (items: string[], max: number) =>
  items.map((i) => i.trim()).filter(Boolean).slice(0, max);

/** Picks the pillar from the saved list, matching loosely, so a typo never invents a new pillar. */
export function matchPillar(pillar: string, pillars: readonly string[]): string {
  const wanted = pillar.trim().toLowerCase();
  return (
    pillars.find((p) => p.toLowerCase() === wanted) ??
    pillars.find((p) => p.toLowerCase().includes(wanted) || wanted.includes(p.toLowerCase())) ??
    pillar.trim()
  );
}

type Context = { pillars: readonly string[]; bannedPhrases: readonly string[] };

function quality(text: string, ctx: Context) {
  return { banned_found: findBannedPhrases(text, ctx.bannedPhrases) };
}

/** Turns a checked AI answer into the columns saved on a LinkedIn post. */
export function linkedInRow(draft: LinkedInDraft, ctx: Context) {
  const body = draft.body.trim();
  return {
    platform: "linkedin" as const,
    title: draft.title.trim().slice(0, 200) || "Untitled draft",
    hook: draft.hook.trim(),
    body,
    alt_hooks: clean(draft.alt_hooks, 2),
    cta: draft.cta?.trim() || null,
    pillar: matchPillar(draft.pillar, ctx.pillars),
    objective: draft.objective.trim(),
    tone: draft.tone.trim(),
    length: draft.length,
    format: draft.format.trim(),
    format_reason: draft.format_reason.trim(),
    keywords: clean(draft.keywords, 6),
    hashtags: normaliseHashtags(draft.hashtags, 5),
    structured_content: {
      clarifying_question: draft.clarifying_question?.trim() || null,
      ...quality(body, ctx),
    },
    safety_status: draft.safety_status,
    safety_reasons: clean(draft.safety_reasons, 10),
    review_notes: draft.review_notes.trim(),
    needs_user_confirmation: draft.needs_user_confirmation,
  };
}

export function socialRow(draft: SocialDraft, ctx: Context) {
  const body = draft.body.trim();
  return {
    platform: "instagram_facebook" as const,
    title: draft.title.trim().slice(0, 200) || "Untitled draft",
    body,
    format: draft.format.trim(),
    format_reason: draft.format_reason.trim(),
    keywords: clean(draft.keywords, 6),
    hashtags: normaliseHashtags(draft.hashtags, 8),
    structured_content: { cover_text: draft.cover_text?.trim() || null, ...quality(body, ctx) },
    safety_status: draft.safety_status,
    safety_reasons: clean(draft.safety_reasons, 10),
    review_notes: draft.review_notes.trim(),
    needs_user_confirmation: draft.needs_user_confirmation,
  };
}

export function tikTokRow(draft: TikTokDraft, ctx: Context) {
  const body = draft.body.trim();
  return {
    platform: "tiktok" as const,
    title: draft.title.trim().slice(0, 200) || "Untitled draft",
    hook: draft.hook.trim(),
    body,
    format: "Short video script",
    format_reason: "",
    keywords: clean(draft.keywords, 6),
    hashtags: normaliseHashtags(draft.hashtags, 6),
    structured_content: {
      beats: clean(draft.beats, 5),
      on_screen_text: clean(draft.on_screen_text, 10),
      shots: clean(draft.shots, 10),
      caption: draft.caption.trim(),
      duration_seconds: Math.max(5, Math.min(600, Math.round(draft.duration_seconds))),
      ...quality(body, ctx),
    },
    safety_status: draft.safety_status,
    safety_reasons: clean(draft.safety_reasons, 10),
    review_notes: draft.review_notes.trim(),
    needs_user_confirmation: draft.needs_user_confirmation,
  };
}

export type CarouselSlide = { kind: "cover" | "content" | "closing"; headline: string; body?: string };

/** Tidies carousel text from the AI into the slides that are saved and drawn. */
export function carouselSlides(draft: CarouselDraft): CarouselSlide[] {
  const content = draft.slides
    .map((s) => ({ headline: s.headline.trim().slice(0, 90), body: s.body.trim().slice(0, 300) }))
    .filter((s) => s.headline)
    .slice(0, 6);
  return [
    { kind: "cover", headline: draft.cover.trim().slice(0, 120) },
    ...content.map((s) => ({ kind: "content" as const, ...s })),
    { kind: "closing", headline: draft.closing.trim().slice(0, 160) },
  ];
}
