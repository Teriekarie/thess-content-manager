import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AiError } from "@/lib/ai/provider";
import { getBrandContext } from "@/lib/data";
import { addDays, DEFAULT_POSTING_DAYS, weekDates, weekStart, weekday } from "@/lib/dates";
import { draftFromIdea, overBudget, type IdeaRow } from "@/lib/drafting";
import { fetchTrendingIdeas } from "@/lib/trending";

/** The posting days of a week, from today on, that have no post yet. */
export function freePostingDays(
  weekOf: string,
  today: string,
  takenDates: readonly string[],
  postingDays: readonly number[] = DEFAULT_POSTING_DAYS,
): string[] {
  const taken = new Set(takenDates);
  return weekDates(weekOf).filter(
    (d) => d >= today && postingDays.includes(weekday(d)) && !taken.has(d),
  );
}

/** Your own ideas first (oldest first), then saved trending suggestions. Dates and holidays are left out. */
export function orderIdeas<T extends { input_type: string; created_at: string }>(ideas: readonly T[]): T[] {
  const usable = ideas.filter((i) => i.input_type !== "event");
  const byAge = (a: T, b: T) => a.created_at.localeCompare(b.created_at);
  return [
    ...usable.filter((i) => i.input_type !== "trending").sort(byAge),
    ...usable.filter((i) => i.input_type === "trending").sort(byAge),
  ];
}

export type PlanResult = {
  week: string;
  status: "done" | "partial" | "full" | "nothing";
  made: number;
  failed: number;
  fromOwnIdeas: number;
  fromTrending: number;
  note: string;
};

/**
 * Makes sure a week has a post on every free posting day.
 * Uses saved ideas first, then fills what is left from what is trending on the web.
 * Running it again only fills days that are still free, so it never makes duplicates.
 */
export async function planWeek(
  supabase: SupabaseClient,
  profileId: string,
  options: { week: string; today: string; source: "button" | "schedule" },
): Promise<PlanResult> {
  const { today } = options;

  async function look(weekOf: string) {
    const { data } = await supabase
      .from("posts")
      .select("scheduled_for, status, title")
      .eq("profile_id", profileId)
      .eq("platform", "linkedin")
      .gte("scheduled_for", weekOf)
      .lte("scheduled_for", addDays(weekOf, 6));
    const kept = (data ?? []).filter((p) => p.status !== "discarded");
    return {
      titles: kept.map((p) => p.title as string),
      free: freePostingDays(weekOf, today, kept.map((p) => p.scheduled_for as string)),
    };
  }

  let week = weekStart(options.week);
  let { titles, free } = await look(week);
  // When this week's posting days have passed or are full, plan next week instead.
  if (free.length === 0 && week === weekStart(today)) {
    week = addDays(week, 7);
    ({ titles, free } = await look(week));
  }
  const base = { week, made: 0, failed: 0, fromOwnIdeas: 0, fromTrending: 0 };
  if (free.length === 0) return { ...base, status: "full", note: "" };

  const { data: saved } = await supabase
    .from("ideas")
    .select("id, raw_content, input_type, tone, created_at")
    .eq("profile_id", profileId)
    .eq("status", "new")
    .limit(100);
  const chosen = orderIdeas(saved ?? []).slice(0, free.length) as (IdeaRow & { created_at: string })[];
  const fromOwnIdeas = chosen.filter((i) => i.input_type !== "trending").length;
  let fromTrending = chosen.length - fromOwnIdeas;

  // Not enough saved ideas: look at what is trending and use that for the empty days.
  const brand = await getBrandContext(supabase, profileId);
  let note = "";
  const missing = free.length - chosen.length;
  if (missing > 0) {
    if (await overBudget(supabase, profileId)) {
      note = "Your monthly AI budget is used up, so trending topics were not searched.";
    } else {
      try {
        const rows = (await fetchTrendingIdeas(supabase, profileId, brand)).slice(0, missing);
        if (rows.length) {
          const { data: added } = await supabase
            .from("ideas")
            .insert(rows)
            .select("id, raw_content, input_type, tone, created_at");
          chosen.push(...((added ?? []) as (IdeaRow & { created_at: string })[]));
          fromTrending += added?.length ?? 0;
        }
        if (rows.length < missing) note = "The trending search did not find enough suitable topics.";
      } catch (error) {
        note =
          error instanceof AiError && error.code === "not-configured"
            ? "The AI is not connected."
            : "The trending search did not work this time.";
      }
    }
  }
  if (chosen.length === 0) return { ...base, status: "nothing", note };

  const results = await Promise.all(
    chosen.map((idea, i) =>
      draftFromIdea(supabase, profileId, idea, brand, {
        scheduledFor: free[i],
        recentTitles: titles,
        research: { status: "skipped", checked_on: null, notes: "", sources: [] },
      }),
    ),
  );
  const made = results.filter((r) => r.ok).length;
  const failed = results.length - made;
  return {
    week,
    made,
    failed,
    fromOwnIdeas,
    fromTrending,
    status: made === free.length ? "done" : made > 0 ? "partial" : "nothing",
    note: failed > 0 && !note ? `${failed} draft${failed === 1 ? "" : "s"} could not be written.` : note,
  };
}

/** Saves a record of a plan run so the board can show when it last ran and what it did. */
export async function recordPlanRun(
  supabase: SupabaseClient,
  profileId: string,
  source: "button" | "schedule",
  startedAt: Date,
  result: PlanResult | null,
  error = "",
) {
  await supabase.from("scheduled_jobs").insert({
    profile_id: profileId,
    job_type: source === "schedule" ? "weekly_plan_auto" : "weekly_plan_manual",
    scheduled_for: result?.week ?? weekStart(new Date().toISOString().slice(0, 10)),
    status: !result
      ? "failed"
      : result.status === "done"
        ? "done"
        : result.status === "partial"
          ? "partial"
          : "skipped",
    started_at: startedAt.toISOString(),
    completed_at: new Date().toISOString(),
    error_summary: (error || result?.note || "").slice(0, 300),
    metadata: result ?? {},
  });
}
