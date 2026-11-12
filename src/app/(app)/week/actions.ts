"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth/session";
import { getBrandContext } from "@/lib/data";
import { draftFromIdea, type IdeaRow } from "@/lib/drafting";
import {
  DEFAULT_POSTING_DAYS,
  isValidDate,
  lagosToday,
  weekDates,
  weekStart,
  weekday,
} from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

/**
 * Fills the free posting days of a week with drafts from saved ideas (oldest first).
 * Running it again only fills days that are still free, so it never makes duplicates.
 * No web check here, to keep the cost of a whole week low.
 */
export async function generatePlan(form: FormData) {
  const owner = await requireOwner();
  const today = lagosToday();
  const requested = String(form.get("week") ?? "");
  const start = weekStart(isValidDate(requested) ? requested : today);
  const back = start === weekStart(today) ? "/week" : `/week?week=${start}`;
  const join = back.includes("?") ? "&" : "?";

  const supabase = await createClient();
  const days = weekDates(start);
  const { data: existing } = await supabase
    .from("posts")
    .select("scheduled_for, status, title")
    .eq("profile_id", owner.id)
    .eq("platform", "linkedin")
    .gte("scheduled_for", start)
    .lte("scheduled_for", days[6]);
  const taken = new Set(
    (existing ?? []).filter((p) => p.status !== "discarded").map((p) => p.scheduled_for as string),
  );
  const freeDays = days.filter(
    (d) => d >= today && DEFAULT_POSTING_DAYS.includes(weekday(d)) && !taken.has(d),
  );
  if (freeDays.length === 0) redirect(`${back}${join}plan=full`);

  const { data: ideas } = await supabase
    .from("ideas")
    .select("id, raw_content, input_type, tone")
    .eq("profile_id", owner.id)
    .eq("status", "new")
    .neq("input_type", "trending")
    .order("created_at")
    .limit(freeDays.length);
  if (!ideas || ideas.length === 0) redirect(`${back}${join}plan=no-ideas`);

  const brand = await getBrandContext(supabase, owner.id);
  const recentTitles = (existing ?? []).map((p) => p.title);
  const results = await Promise.all(
    (ideas as IdeaRow[]).map((idea, i) =>
      draftFromIdea(supabase, owner.id, idea, brand, {
        scheduledFor: freeDays[i],
        recentTitles,
        research: { status: "skipped", checked_on: null, notes: "", sources: [] },
      }),
    ),
  );
  const made = results.filter((r) => r.ok).length;
  const failed = results.length - made;

  revalidatePath("/week");
  revalidatePath("/inbox");
  revalidatePath("/calendar");
  revalidatePath("/");
  redirect(`${back}${join}plan=${made}-${failed}`);
}
