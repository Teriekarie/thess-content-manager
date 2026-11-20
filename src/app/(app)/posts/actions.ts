"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  buildCarouselPrompt,
  buildLinkedInPrompt,
  buildSocialPrompt,
  buildSocialRevisionPrompt,
  buildSystemPrompt,
  buildTikTokPrompt,
  buildTikTokRevisionPrompt,
} from "@/lib/ai/prompts";
import { AiError, generateStructured, type AiUsage } from "@/lib/ai/provider";
import {
  CarouselSchema,
  CombinedDraftSchema,
  SocialDraftSchema,
  TikTokDraftSchema,
} from "@/lib/ai/schemas";
import { requireOwner } from "@/lib/auth/session";
import { carouselSlides, linkedInRow, socialRow, tikTokRow } from "@/lib/content/drafts";
import { getBrandContext, logUsage } from "@/lib/data";
import { isValidDate, lagosToday, sameDayNextWeek } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function refresh(postId: string) {
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/week");
  revalidatePath("/calendar");
  revalidatePath("/");
}

/** Where to go back to after an action: only paths inside the app are accepted. */
function backTo(form: FormData, fallback: string): string {
  const target = text(form, "back");
  return /^\/(week(\?week=\d{4}-\d{2}-\d{2})?|calendar(\?month=\d{4}-\d{2})?|posts\/[0-9a-f-]{36})$/.test(target)
    ? target
    : fallback;
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
  // A discarded post leaves the board straight away. The board shows a one-time Undo.
  if (outcome.data === "discard" && !back.startsWith("/calendar")) {
    const board = back.startsWith("/week") ? back : "/week";
    redirect(`${board}${board.includes("?") ? "&" : "?"}discarded=${post.id}`);
  }
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

/** Saves the current wording of a post before it is replaced, so nothing is lost. */
async function keepVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  post: { id: string; body: string; structured_content: unknown },
  note: string,
) {
  const { data: last } = await supabase
    .from("post_versions")
    .select("version_number")
    .eq("post_id", post.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("post_versions").insert({
    profile_id: profileId,
    post_id: post.id,
    version_number: (last?.version_number ?? 0) + 1,
    body: post.body,
    structured_content: post.structured_content ?? {},
    change_note: note,
  });
  return !error;
}

/**
 * Rewrites a draft following the author's instructions, or her answer to the AI's question.
 * Works on every platform and can be used as many times as she likes. A LinkedIn change also
 * updates its Instagram + Facebook twin. The previous wording is saved in post_versions first.
 */
export async function reviseDraft(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  const instructions = text(form, "answer").slice(0, 3000);
  if (!id.success) redirect("/week");
  if (instructions.length < 3) redirect(`/posts/${id.data}?error=answer#change`);

  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", id.data).maybeSingle();
  if (!post) redirect("/week");
  const extra = (post.structured_content ?? {}) as Record<string, unknown>;
  const question =
    form.get("mode") === "answer" && typeof extra.clarifying_question === "string"
      ? extra.clarifying_question
      : null;
  const previousRequests = Array.isArray(extra.answers) ? extra.answers : [];
  const request = { question, answer: instructions };
  const brand = await getBrandContext(supabase, owner.id);
  const fail = async (error: unknown) => {
    const code = error instanceof AiError ? error.code : "failed";
    await logUsage(supabase, owner.id, "revise_draft", null, code);
    redirect(`/posts/${post.id}?error=ai-${code}#change`);
  };
  const note = "Before rewrite from your instructions";

  if (post.platform === "instagram_facebook" || post.platform === "tiktok") {
    let row;
    try {
      if (post.platform === "tiktok") {
        const script = [
          post.body,
          ...(Array.isArray(extra.beats) ? [`Beats: ${(extra.beats as string[]).join(" | ")}`] : []),
          ...(typeof extra.caption === "string" ? [`Caption: ${extra.caption}`] : []),
        ].join("\n\n");
        const result = await generateStructured({
          system: buildSystemPrompt(brand),
          prompt: buildTikTokRevisionPrompt(script, instructions),
          schema: TikTokDraftSchema,
        });
        await logUsage(supabase, owner.id, "revise_draft", result.usage, "ok");
        row = tikTokRow(result.data, brand);
      } else {
        const result = await generateStructured({
          system: buildSystemPrompt(brand),
          prompt: buildSocialRevisionPrompt(post.body, instructions),
          schema: SocialDraftSchema,
        });
        await logUsage(supabase, owner.id, "revise_draft", result.usage, "ok");
        row = socialRow(result.data, brand);
      }
    } catch (error) {
      return fail(error);
    }
    if (!(await keepVersion(supabase, owner.id, post, note))) redirect(`/posts/${post.id}?error=save`);
    await supabase
      .from("posts")
      .update({
        ...row,
        structured_content: { ...row.structured_content, answers: [...previousRequests, request] },
      })
      .eq("id", post.id);
    refresh(post.id);
    redirect(`/posts/${post.id}?saved=rewritten`);
  }

  const { data: idea } = post.source_idea_id
    ? await supabase
        .from("ideas")
        .select("raw_content, input_type, tone")
        .eq("id", post.source_idea_id)
        .maybeSingle()
    : { data: null };

  let result;
  try {
    result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildLinkedInPrompt({
        idea: idea?.raw_content ?? post.body,
        inputType: idea?.input_type ?? "thought",
        tone: idea?.tone ?? "auto",
        recentTitles: [],
        research:
          extra.research && typeof extra.research === "object"
            ? String((extra.research as { notes?: string }).notes ?? "") || null
            : null,
        revision: { currentPost: post.body, question, answer: instructions },
      }),
      schema: CombinedDraftSchema,
      maxTokens: 10000,
    });
  } catch (error) {
    return fail(error);
  }
  await logUsage(supabase, owner.id, "revise_draft", result.usage, "ok");

  const { data: child } = await supabase
    .from("posts")
    .select("id, body, structured_content")
    .eq("parent_post_id", post.id)
    .eq("platform", "instagram_facebook")
    .maybeSingle();

  for (const old of [post, child]) {
    if (old && !(await keepVersion(supabase, owner.id, old, note))) {
      redirect(`/posts/${post.id}?error=save`);
    }
  }

  const linkedIn = linkedInRow(result.data.linkedin, brand);
  await supabase
    .from("posts")
    .update({
      ...linkedIn,
      structured_content: {
        ...linkedIn.structured_content,
        research: extra.research ?? null,
        answers: [...previousRequests, request],
      },
    })
    .eq("id", post.id);

  const social = socialRow(result.data.instagram_facebook, brand);
  if (child) {
    await supabase.from("posts").update(social).eq("id", child.id);
  } else {
    await supabase.from("posts").insert({
      ...social,
      profile_id: owner.id,
      parent_post_id: post.id,
      source_idea_id: post.source_idea_id,
      pillar: linkedIn.pillar,
      objective: linkedIn.objective,
      tone: linkedIn.tone,
      scheduled_for: post.scheduled_for,
    });
  }
  refresh(post.id);
  redirect(`/posts/${post.id}?saved=rewritten`);
}

/** Writes the slide text for a carousel from a post. The slides are then drawn by the app. */
export async function writeCarousel(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/week");

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, body, structured_content")
    .eq("id", id.data)
    .maybeSingle();
  if (!post) redirect("/week");

  const brand = await getBrandContext(supabase, owner.id);
  let result;
  try {
    result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildCarouselPrompt(post.body),
      schema: CarouselSchema,
      maxTokens: 4000,
    });
  } catch (error) {
    const code = error instanceof AiError ? error.code : "failed";
    await logUsage(supabase, owner.id, "carousel_text", null, code);
    redirect(`/posts/${post.id}?error=ai-${code}#visual`);
  }
  await logUsage(supabase, owner.id, "carousel_text", result.usage, "ok");

  await supabase
    .from("posts")
    .update({
      visual_choice: "carousel",
      structured_content: { ...(post.structured_content ?? {}), carousel: carouselSlides(result.data) },
    })
    .eq("id", post.id);
  refresh(post.id);
  redirect(`/posts/${post.id}#visual`);
}

/** Saves the author's own edit of a post. The earlier wording is kept in post_versions. */
export async function editPost(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  const body = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (!id.success) redirect("/week");
  if (body.length < 5 || body.length > 8000) redirect(`/posts/${id.data}?error=edit`);

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, body, structured_content")
    .eq("id", id.data)
    .maybeSingle();
  if (!post) redirect("/week");
  if (post.body === body) redirect(`/posts/${post.id}`);

  const { data: last } = await supabase
    .from("post_versions")
    .select("version_number")
    .eq("post_id", post.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("post_versions").insert({
    profile_id: owner.id,
    post_id: post.id,
    version_number: (last?.version_number ?? 0) + 1,
    body: post.body,
    structured_content: post.structured_content ?? {},
    change_note: "Before the author's own edit",
  });
  if (error) redirect(`/posts/${post.id}?error=save`);

  await supabase.from("posts").update({ body }).eq("id", post.id);
  refresh(post.id);
  redirect(`/posts/${post.id}?saved=edited`);
}
