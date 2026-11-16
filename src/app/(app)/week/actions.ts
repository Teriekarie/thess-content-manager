"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth/session";
import { isValidDate, lagosToday, weekStart } from "@/lib/dates";
import { planWeek, recordPlanRun } from "@/lib/planning";
import { createClient } from "@/lib/supabase/server";

/**
 * Gives the week a post on every free posting day: saved ideas first, then trending topics.
 * Running it again only fills days that are still free, so it never makes duplicates.
 */
export async function generatePlan(form: FormData) {
  const owner = await requireOwner();
  const today = lagosToday();
  const requested = String(form.get("week") ?? "");
  const supabase = await createClient();

  const started = new Date();
  const result = await planWeek(supabase, owner.id, {
    week: isValidDate(requested) ? requested : today,
    today,
    source: "button",
  });
  await recordPlanRun(supabase, owner.id, "button", started, result);

  for (const path of ["/week", "/inbox", "/calendar", "/"]) revalidatePath(path);
  const back = result.week === weekStart(today) ? "/week" : `/week?week=${result.week}`;
  const code =
    result.status === "full"
      ? "full"
      : result.status === "nothing"
        ? "nothing"
        : `${result.made}-${result.failed}-${result.fromTrending}`;
  redirect(`${back}${back.includes("?") ? "&" : "?"}plan=${code}`);
}
