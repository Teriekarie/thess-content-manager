import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLinkedInPrompt,
  buildResearchQuestion,
  buildSystemPrompt,
  type BrandContext,
  type IdeaType,
} from "@/lib/ai/prompts";
import { AiError, generateStructured, type AiErrorCode } from "@/lib/ai/provider";
import { searchWeb, type WebSource } from "@/lib/ai/research";
import { CombinedDraftSchema } from "@/lib/ai/schemas";
import type { Tone } from "@/lib/content/defaults";
import { linkedInRow, socialRow } from "@/lib/content/drafts";
import { getBrandSettings, logUsage, monthSpend } from "@/lib/data";
import { lagosToday } from "@/lib/dates";

export type IdeaRow = { id: string; raw_content: string; input_type: IdeaType; tone: Tone };

export type ResearchRecord = {
  status: "done" | "failed" | "skipped" | "over_budget";
  checked_on: string | null;
  notes: string;
  sources: WebSource[];
};

/** True when a monthly budget is set and the estimated spend has reached it. */
export async function overBudget(supabase: SupabaseClient, profileId: string): Promise<boolean> {
  const settings = await getBrandSettings(supabase, profileId);
  if (!settings.monthlyBudget) return false;
  return (await monthSpend(supabase, profileId)) >= settings.monthlyBudget;
}

/**
 * Optional live web check before drafting. It never stops a draft:
 * if the search fails, the draft is written without it and the failure is recorded.
 */
export async function researchIdea(
  supabase: SupabaseClient,
  profileId: string,
  idea: string,
  wanted: boolean,
): Promise<ResearchRecord> {
  const empty = { checked_on: null, notes: "", sources: [] };
  if (!wanted) return { status: "skipped", ...empty };
  if (await overBudget(supabase, profileId)) return { status: "over_budget", ...empty };
  try {
    const result = await searchWeb({
      question: buildResearchQuestion(idea, lagosToday()),
      maxSearches: 2,
    });
    await logUsage(supabase, profileId, "web_check", result.usage, "ok");
    return {
      status: "done",
      checked_on: lagosToday(),
      notes: result.notes.slice(0, 2500),
      sources: result.sources.slice(0, 6),
    };
  } catch (error) {
    await logUsage(supabase, profileId, "web_check", null, error instanceof AiError ? error.code : "failed");
    return { status: "failed", ...empty };
  }
}

type DraftResult = { ok: true; postId: string } | { ok: false; error: AiErrorCode | "save" };

/**
 * Writes the LinkedIn draft and its Instagram + Facebook caption in one AI request
 * and saves both. The idea itself is never changed, apart from its status.
 */
export async function draftFromIdea(
  supabase: SupabaseClient,
  profileId: string,
  idea: IdeaRow,
  brand: BrandContext,
  options: { scheduledFor: string; recentTitles: string[]; research: ResearchRecord },
): Promise<DraftResult> {
  let result;
  try {
    result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildLinkedInPrompt({
        idea: idea.raw_content,
        inputType: idea.input_type,
        tone: idea.tone,
        recentTitles: options.recentTitles,
        research: options.research.status === "done" ? options.research.notes : null,
      }),
      schema: CombinedDraftSchema,
      maxTokens: 10000,
    });
  } catch (error) {
    const code = error instanceof AiError ? error.code : "failed";
    await logUsage(supabase, profileId, "linkedin_and_social_draft", null, code);
    return { ok: false, error: code };
  }
  await logUsage(supabase, profileId, "linkedin_and_social_draft", result.usage, "ok");

  const linkedIn = linkedInRow(result.data.linkedin, brand);
  const metadata = {
    model: result.usage.model,
    input_tokens: result.usage.inputTokens,
    output_tokens: result.usage.outputTokens,
    voice_guide_used: Boolean(brand.voiceGuide),
  };
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      ...linkedIn,
      structured_content: { ...linkedIn.structured_content, research: options.research },
      profile_id: profileId,
      source_idea_id: idea.id,
      scheduled_for: options.scheduledFor,
      generation_metadata: metadata,
    })
    .select("id")
    .single();
  if (error || !post) return { ok: false, error: "save" };

  // If saving the caption fails, the LinkedIn draft is kept and the caption can be added later.
  await supabase.from("posts").insert({
    ...socialRow(result.data.instagram_facebook, brand),
    profile_id: profileId,
    parent_post_id: post.id,
    source_idea_id: idea.id,
    pillar: linkedIn.pillar,
    objective: linkedIn.objective,
    tone: linkedIn.tone,
    scheduled_for: options.scheduledFor,
    generation_metadata: { model: result.usage.model, shared_request_with: post.id },
  });

  await supabase.from("ideas").update({ status: "drafted" }).eq("id", idea.id);
  return { ok: true, postId: post.id };
}
