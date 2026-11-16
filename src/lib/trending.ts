import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildSystemPrompt,
  buildTrendingIdeasPrompt,
  buildTrendingQuestion,
  type BrandContext,
} from "@/lib/ai/prompts";
import { AiError, generateStructured } from "@/lib/ai/provider";
import { searchWeb } from "@/lib/ai/research";
import { TrendingIdeasSchema } from "@/lib/ai/schemas";
import { matchPillar } from "@/lib/content/drafts";
import { logUsage } from "@/lib/data";
import { lagosToday } from "@/lib/dates";

export type TrendingRow = {
  profile_id: string;
  raw_content: string;
  input_type: "trending";
  tone: string;
  source_url: string;
  source_title: string;
};

/**
 * Searches the live web for current talking points and returns up to five suggested ideas,
 * each for a different content pillar and with a link that really came back from the search. Nothing is saved here.
 * Throws AiError when the search or the AI fails; returns [] when nothing suitable is found.
 */
export type TrendingSuggestion = { row: TrendingRow; pillar: string };

export async function fetchTrendingIdeas(
  supabase: SupabaseClient,
  profileId: string,
  brand: BrandContext,
  avoidPillars: string[] = [],
): Promise<TrendingSuggestion[]> {
  let research;
  try {
    research = await searchWeb({ question: buildTrendingQuestion(lagosToday()), maxSearches: 3 });
  } catch (error) {
    await logUsage(supabase, profileId, "trending_search", null, error instanceof AiError ? error.code : "failed");
    throw error;
  }
  await logUsage(supabase, profileId, "trending_search", research.usage, `ok: ${research.detail}`.slice(0, 200));
  if (research.sources.length === 0) return [];

  let result;
  try {
    result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildTrendingIdeasPrompt(research.notes, research.sources.slice(0, 20), avoidPillars),
      schema: TrendingIdeasSchema,
      maxTokens: 4000,
    });
  } catch (error) {
    await logUsage(supabase, profileId, "trending_ideas", null, error instanceof AiError ? error.code : "failed");
    throw error;
  }
  await logUsage(supabase, profileId, "trending_ideas", result.usage, "ok");

  const known = new Map(research.sources.map((s) => [s.url, s]));
  return result.data.ideas
    .filter((i) => known.has(i.source_url) && i.topic.trim())
    .slice(0, 5)
    .map((i) => ({
      pillar: matchPillar(i.pillar, brand.pillars),
      row: {
        profile_id: profileId,
        raw_content: `${i.topic.trim()}\n\nAngle: ${i.angle.trim()}`,
        input_type: "trending" as const,
        tone: i.tone,
        source_url: i.source_url,
        source_title: known.get(i.source_url)?.title ?? "",
      },
    }));
}
