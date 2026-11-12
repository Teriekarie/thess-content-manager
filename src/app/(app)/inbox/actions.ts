"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildSystemPrompt, buildTrendingIdeasPrompt, buildTrendingQuestion } from "@/lib/ai/prompts";
import { AiError, generateStructured } from "@/lib/ai/provider";
import { searchWeb, type WebSource } from "@/lib/ai/research";
import { TrendingIdeasSchema, type TrendingIdeas } from "@/lib/ai/schemas";
import { requireOwner } from "@/lib/auth/session";
import { LEARNING_NOTE_FIELDS, TONES, type Tone } from "@/lib/content/defaults";
import { buildLearningNote } from "@/lib/content/text";
import { getBrandContext, logUsage } from "@/lib/data";
import { draftFromIdea, overBudget, researchIdea } from "@/lib/drafting";
import { lagosToday, nextPostingDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const toneSchema = z.enum(Object.keys(TONES) as [Tone, ...Tone[]]);

export async function addIdea(form: FormData) {
  const owner = await requireOwner();
  const inputType = text(form, "input_type") === "learning_note" ? "learning_note" : "thought";
  const tone = toneSchema.safeParse(text(form, "tone"));

  const raw =
    inputType === "learning_note"
      ? buildLearningNote(
          LEARNING_NOTE_FIELDS.map((f) => ({ label: f.label, value: text(form, f.name) })),
        ) || text(form, "pasted")
      : text(form, "thought");

  if (raw.length < 10) redirect("/inbox?error=short");
  if (raw.length > 12000) redirect("/inbox?error=long");

  const supabase = await createClient();
  const { error } = await supabase.from("ideas").insert({
    profile_id: owner.id,
    raw_content: raw,
    input_type: inputType,
    tone: tone.success ? tone.data : "auto",
  });
  if (error) redirect("/inbox?error=save");
  revalidatePath("/inbox");
  redirect("/inbox?saved=idea");
}

export async function archiveIdea(form: FormData) {
  await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/inbox");
  const supabase = await createClient();
  await supabase.from("ideas").update({ status: "archived" }).eq("id", id.data);
  revalidatePath("/inbox");
  redirect("/inbox");
}

/**
 * Writes the LinkedIn draft and its Instagram + Facebook caption from a saved idea,
 * after an optional live web check.
 */
export async function createDraft(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/inbox");

  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("id, raw_content, input_type, tone")
    .eq("id", id.data)
    .maybeSingle();
  if (!idea) redirect("/inbox?error=missing");

  const brand = await getBrandContext(supabase, owner.id);
  const { data: recent } = await supabase
    .from("posts")
    .select("title, scheduled_for, status")
    .eq("profile_id", owner.id)
    .eq("platform", "linkedin")
    .order("created_at", { ascending: false })
    .limit(30);
  const taken = (recent ?? [])
    .filter((r) => r.status !== "discarded" && r.scheduled_for)
    .map((r) => r.scheduled_for as string);

  const research = await researchIdea(supabase, owner.id, idea.raw_content, form.get("web") === "on");
  const result = await draftFromIdea(supabase, owner.id, idea, brand, {
    scheduledFor: nextPostingDate(lagosToday(), taken),
    recentTitles: (recent ?? []).slice(0, 10).map((r) => r.title),
    research,
  });
  if (!result.ok) redirect(`/inbox?error=${result.error === "save" ? "save" : `ai-${result.error}`}`);

  revalidatePath("/inbox");
  revalidatePath("/week");
  redirect(`/posts/${result.postId}`);
}

/** Searches the live web for current talking points and saves up to five as suggested ideas. */
export async function findTrendingIdeas() {
  const owner = await requireOwner();
  const supabase = await createClient();
  if (await overBudget(supabase, owner.id)) redirect("/inbox?error=budget");

  const brand = await getBrandContext(supabase, owner.id);
  let ideas: TrendingIdeas["ideas"];
  let sources: WebSource[];
  try {
    const research = await searchWeb({
      question: buildTrendingQuestion(lagosToday(), brand.keywords),
      maxSearches: 3,
    });
    await logUsage(supabase, owner.id, "trending_search", research.usage, "ok");
    sources = research.sources;
    if (!research.notes || sources.length === 0) redirect("/inbox?error=nothing-trending");

    const result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildTrendingIdeasPrompt(research.notes, sources.slice(0, 20)),
      schema: TrendingIdeasSchema,
      maxTokens: 4000,
    });
    await logUsage(supabase, owner.id, "trending_ideas", result.usage, "ok");
    ideas = result.data.ideas;
  } catch (error) {
    if (!(error instanceof AiError)) throw error; // lets redirect() through
    await logUsage(supabase, owner.id, "trending_ideas", null, error.code);
    redirect(`/inbox?error=ai-${error.code}`);
  }

  // Only keep suggestions whose link really came back from the search.
  const known = new Map(sources.map((s) => [s.url, s]));
  const rows = ideas
    .filter((i) => known.has(i.source_url) && i.topic.trim())
    .slice(0, 5)
    .map((i) => ({
      profile_id: owner.id,
      raw_content: `${i.topic.trim()}\n\nAngle: ${i.angle.trim()}`,
      input_type: "trending",
      tone: i.tone,
      source_url: i.source_url,
      source_title: known.get(i.source_url)?.title ?? "",
    }));
  if (rows.length === 0) redirect("/inbox?error=nothing-trending");

  const { error } = await supabase.from("ideas").insert(rows);
  if (error) redirect("/inbox?error=save");
  revalidatePath("/inbox");
  redirect(`/inbox?saved=trending-${rows.length}`);
}
