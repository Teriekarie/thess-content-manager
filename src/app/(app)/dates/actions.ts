"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildEventsPrompt, buildEventsQuestion, buildSystemPrompt } from "@/lib/ai/prompts";
import { AiError, generateStructured } from "@/lib/ai/provider";
import { searchWeb, type WebSource } from "@/lib/ai/research";
import { EventsSchema, type EventList } from "@/lib/ai/schemas";
import { requireOwner } from "@/lib/auth/session";
import { getBrandContext, logUsage } from "@/lib/data";
import { addDays, formatLong, isValidDate, lagosToday } from "@/lib/dates";
import { draftFromIdea, overBudget } from "@/lib/drafting";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** Searches the live web for upcoming dates and saves the ones confirmed by a source. */
export async function findDates() {
  const owner = await requireOwner();
  const supabase = await createClient();
  if (await overBudget(supabase, owner.id)) redirect("/dates?error=budget");

  const today = lagosToday();
  const until = addDays(today, 70);
  const brand = await getBrandContext(supabase, owner.id);
  let events: EventList["events"];
  let sources: WebSource[];
  try {
    const research = await searchWeb({ question: buildEventsQuestion(today, until), maxSearches: 3 });
    await logUsage(supabase, owner.id, "dates_search", research.usage, "ok");
    sources = research.sources;
    if (!research.notes || sources.length === 0) redirect("/dates?error=nothing");

    const result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildEventsPrompt(research.notes, sources.slice(0, 25), today, until),
      schema: EventsSchema,
      maxTokens: 5000,
    });
    await logUsage(supabase, owner.id, "dates_list", result.usage, "ok");
    events = result.data.events;
  } catch (error) {
    if (!(error instanceof AiError)) throw error; // lets redirect() through
    await logUsage(supabase, owner.id, "dates_list", null, error.code);
    redirect(`/dates?error=ai-${error.code}`);
  }

  // Keep only real dates inside the window whose link came back from the search.
  const known = new Map(sources.map((s) => [s.url, s]));
  const rows = events
    .filter((e) => isValidDate(e.date) && e.date >= today && e.date <= until)
    .filter((e) => known.has(e.source_url) && e.name.trim())
    .slice(0, 12)
    .map((e) => ({
      profile_id: owner.id,
      event_date: e.date,
      name: e.name.trim().slice(0, 150),
      category: e.category,
      geography: e.geography.trim().slice(0, 80),
      source_url: e.source_url,
      source_title: known.get(e.source_url)?.title ?? "",
      relevance_reason: e.relevance_reason.trim(),
      suggested_angle: e.suggested_angle.trim(),
    }));
  if (rows.length === 0) redirect("/dates?error=nothing");

  // Dates already saved are left as they are, so pressing the button twice makes no duplicates.
  const { error } = await supabase
    .from("calendar_events")
    .upsert(rows, { onConflict: "profile_id,event_date,name", ignoreDuplicates: true });
  if (error) redirect("/dates?error=save");
  revalidatePath("/dates");
  redirect("/dates?saved=found");
}

export async function skipDate(form: FormData) {
  await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/dates");
  const supabase = await createClient();
  const status = text(form, "undo") === "1" ? "open" : "skipped";
  await supabase.from("calendar_events").update({ status }).eq("id", id.data);
  revalidatePath("/dates");
  redirect("/dates");
}

/** Writes the posts for one date and schedules them on that day. */
export async function draftForDate(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/dates");

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id.data)
    .maybeSingle();
  if (!event) redirect("/dates");
  if (event.post_id) redirect(`/posts/${event.post_id}`);

  const today = lagosToday();
  const raw = `${event.name}, on ${formatLong(event.event_date)}${
    event.geography ? ` (${event.geography})` : ""
  }.\n\nSuggested angle: ${event.suggested_angle}`;
  const { data: idea, error } = await supabase
    .from("ideas")
    .insert({
      profile_id: owner.id,
      raw_content: raw,
      input_type: "event",
      tone: "auto",
      source_url: event.source_url,
      source_title: event.source_title,
    })
    .select("id, raw_content, input_type, tone")
    .single();
  if (error || !idea) redirect("/dates?error=save");

  const brand = await getBrandContext(supabase, owner.id);
  const result = await draftFromIdea(supabase, owner.id, idea, brand, {
    scheduledFor: event.event_date < today ? today : event.event_date,
    recentTitles: [],
    research: { status: "skipped", checked_on: null, notes: "", sources: [] },
  });
  if (!result.ok) {
    await supabase.from("ideas").update({ status: "archived" }).eq("id", idea.id);
    redirect(`/dates?error=${result.error === "save" ? "save" : `ai-${result.error}`}`);
  }

  await supabase
    .from("calendar_events")
    .update({ status: "drafted", idea_id: idea.id, post_id: result.postId })
    .eq("id", event.id);
  for (const path of ["/dates", "/week", "/calendar", "/"]) revalidatePath(path);
  redirect(`/posts/${result.postId}`);
}
