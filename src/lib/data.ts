import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { estimateCost } from "@/lib/ai/pricing";
import type { BrandContext } from "@/lib/ai/prompts";
import type { AiUsage } from "@/lib/ai/provider";
import {
  DEFAULT_AUDIENCE,
  DEFAULT_BANNED_PHRASES,
  DEFAULT_HANDLE,
  DEFAULT_KEYWORDS,
  DEFAULT_PILLARS,
  DEFAULT_POSITIONING,
} from "@/lib/content/defaults";
import { asStringArray } from "@/lib/content/text";

export type BrandSettings = {
  positioning: string;
  handle: string;
  bio: string;
  audience: string[];
  pillars: string[];
  keywords: string[];
  bannedPhrases: string[];
  monthlyBudget: number | null;
  saved: boolean;
};

/** Saved settings, or the PRD starting values when nothing has been saved yet. */
export async function getBrandSettings(
  supabase: SupabaseClient,
  profileId: string,
): Promise<BrandSettings> {
  const { data } = await supabase
    .from("brand_settings")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data) {
    return {
      positioning: DEFAULT_POSITIONING,
      handle: DEFAULT_HANDLE,
      bio: "",
      audience: DEFAULT_AUDIENCE,
      pillars: DEFAULT_PILLARS,
      keywords: DEFAULT_KEYWORDS,
      bannedPhrases: DEFAULT_BANNED_PHRASES,
      monthlyBudget: null,
      saved: false,
    };
  }
  return {
    positioning: data.positioning ?? "",
    handle: data.handle ?? "",
    bio: data.professional_bio ?? "",
    audience: asStringArray(data.audience_priorities),
    pillars: asStringArray(data.pillars),
    keywords: asStringArray(data.keyword_library),
    bannedPhrases: asStringArray(data.banned_phrases),
    monthlyBudget: data.monthly_ai_budget === null ? null : Number(data.monthly_ai_budget),
    saved: true,
  };
}

export async function getBrandContext(
  supabase: SupabaseClient,
  profileId: string,
): Promise<BrandContext> {
  const settings = await getBrandSettings(supabase, profileId);
  const { data: guide } = await supabase
    .from("voice_guides")
    .select("guide_content")
    .eq("profile_id", profileId)
    .eq("active", true)
    .maybeSingle();
  return {
    positioning: settings.positioning,
    bio: settings.bio,
    audience: settings.audience,
    pillars: settings.pillars,
    keywords: settings.keywords,
    bannedPhrases: settings.bannedPhrases,
    voiceGuide: guide?.guide_content ?? null,
  };
}

/** Records one AI call. Never stores the prompt or the answer. */
export async function logUsage(
  supabase: SupabaseClient,
  profileId: string,
  taskType: string,
  usage: AiUsage | null,
  status: string,
) {
  await supabase.from("usage_logs").insert({
    profile_id: profileId,
    task_type: taskType,
    provider: usage?.provider ?? "anthropic",
    model: usage?.model ?? "",
    input_tokens: usage?.inputTokens ?? 0,
    output_tokens: usage?.outputTokens ?? 0,
    estimated_cost: usage ? estimateCost(usage.model, usage.inputTokens, usage.outputTokens) : null,
    latency_ms: usage?.latencyMs ?? null,
    status,
  });
}

/** Estimated AI spend so far this calendar month, in US dollars. */
export async function monthSpend(supabase: SupabaseClient, profileId: string): Promise<number> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { data } = await supabase
    .from("usage_logs")
    .select("estimated_cost")
    .eq("profile_id", profileId)
    .gte("created_at", start);
  return (data ?? []).reduce((sum, row) => sum + Number(row.estimated_cost ?? 0), 0);
}
