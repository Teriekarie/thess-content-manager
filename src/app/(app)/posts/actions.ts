"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildSocialPrompt, buildSystemPrompt, buildTikTokPrompt } from "@/lib/ai/prompts";
import { AiError, generateStructured, type AiUsage } from "@/lib/ai/provider";
import { SocialDraftSchema, TikTokDraftSchema } from "@/lib/ai/schemas";
import { requireOwner } from "@/lib/auth/session";
import { socialRow, tikTokRow } from "@/lib/content/drafts";
import { getBrandContext, logUsage } from "@/lib/data";
import { isValidDate, lagosToday, sameDayNextWeek } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function refresh(postId: string) {
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/week");
}

/** Where to go back to after an action: only paths inside the app are accepted. */
function backTo(form: FormData, fallback: string): string {
  const target = text(form, "back");
  return /^\/(week|posts\/[0-9a-f-]{36})(\?week=\d{4}-\d{2}-\d{2})?$/.test(target) ? target : fallback;
}

const OutcomeSchema = z.enum(["posted", "next_week", "schedule", "discard", "undo"]);

/** Posted, carry over to next week, schedule for a date, discard, or undo. */
export async function setOutcome(form: FormData) {
  await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  const outcome = OutcomeSchema.safeParse(text(form, "outcome"));
  if (!id.success || !outcome.success) redirect("/week");
  const back = backTo(form, `/posts/${id.data}`);

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, scheduled_for, carried_over_count")
    .eq("id", id.data)
    .maybeSingle();
  if (!post) redirect("/week");

  let change: Record<string, unknown>;
  switch (outcome.data) {
    case "posted":
      change = { status: "posted", posted_at: new Date().toISOString() };
      break;
    case "next_week":
      change = {
        status: "planned",
        posted_at: null,
        scheduled_for: sameDayNextWeek(post.scheduled_for ?? lagosToday()),
        carried_over_count: post.carried_over_count + 1,
      };
      break;
    case "schedule": {
      const date = text(form, "date");
      if (!isValidDate(date)) redirect(`${back}${back.includes("?") ? "&" : "?"}error=date`);
      change = { status: "planned", posted_at: null, scheduled_for: date };
      break;
    }
    case "discard":
      change = { status: "discarded", posted_at: null };
      break;
    default:
      change = { status: "planned", posted_at: null };
  }

  await supabase.from("posts").update(change).eq("id", post.id);
  refresh(post.id);
  redirect(back);
}

export async function rateDraft(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  const rating = z.enum(["up", "down"]).safeParse(text(form, "rating"));
  if (!id.success || !rating.success) redirect("/week");

  const supabase = await createClient();
  await supabase.from("feedback").insert({
    profile_id: owner.id,
    post_id: id.data,
    rating: rating.data,
    comment: text(form, "comment").slice(0, 1000),
  });
  refresh(id.data);
  redirect(`/posts/${id.data}?saved=rating`);
}

export async function setVisualChoice(form: FormData) {
  await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  const choice = z
    .enum(["generate_image", "carousel", "own_photo", "none"])
    .safeParse(text(form, "choice"));
  if (!id.success || !choice.success) redirect("/week");
  const supabase = await createClient();
  await supabase.from("posts").update({ visual_choice: choice.data }).eq("id", id.data);
  refresh(id.data);
  redirect(`/posts/${id.data}`);
}

/** Writes the Instagram + Facebook caption or the TikTok script from a LinkedIn post. */
export async function addAdaptation(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  const platform = z.enum(["instagram_facebook", "tiktok"]).safeParse(text(form, "platform"));
  if (!id.success || !platform.success) redirect("/week");

  const supabase = await createClient();
  const { data: parent } = await supabase
    .from("posts")
    .select("id, body, pillar, objective, tone, scheduled_for, source_idea_id, platform")
    .eq("id", id.data)
    .maybeSingle();
  if (!parent || parent.platform !== "linkedin") redirect("/week");

  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("parent_post_id", parent.id)
    .eq("platform", platform.data)
    .maybeSingle();
  if (existing) redirect(`/posts/${existing.id}`);

  const brand = await getBrandContext(supabase, owner.id);
  const task = platform.data === "tiktok" ? "tiktok_script" : "social_caption";
  let row;
  let usage: AiUsage;
  try {
    if (platform.data === "tiktok") {
      const result = await generateStructured({
        system: buildSystemPrompt(brand),
        prompt: buildTikTokPrompt(parent.body),
        schema: TikTokDraftSchema,
      });
      row = tikTokRow(result.data, brand);
      usage = result.usage;
    } else {
      const result = await generateStructured({
        system: buildSystemPrompt(brand),
        prompt: buildSocialPrompt(parent.body),
        schema: SocialDraftSchema,
      });
      row = socialRow(result.data, brand);
      usage = result.usage;
    }
  } catch (error) {
    const code = error instanceof AiError ? error.code : "failed";
    await logUsage(supabase, owner.id, task, null, code);
    redirect(`/posts/${parent.id}?error=ai-${code}`);
  }
  await logUsage(supabase, owner.id, task, usage, "ok");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      ...row,
      profile_id: owner.id,
      parent_post_id: parent.id,
      source_idea_id: parent.source_idea_id,
      pillar: parent.pillar,
      objective: parent.objective,
      tone: parent.tone,
      scheduled_for: parent.scheduled_for,
      generation_metadata: {
        model: usage.model,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
      },
    })
    .select("id")
    .single();
  if (error || !post) redirect(`/posts/${parent.id}?error=save`);
  refresh(parent.id);
  redirect(`/posts/${post.id}`);
}
