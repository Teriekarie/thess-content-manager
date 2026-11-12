"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildLinkedInPrompt, buildSystemPrompt } from "@/lib/ai/prompts";
import { AiError, generateStructured, type AiUsage } from "@/lib/ai/provider";
import { CombinedDraftSchema, type CombinedDraft } from "@/lib/ai/schemas";
import { requireOwner } from "@/lib/auth/session";
import { LEARNING_NOTE_FIELDS, TONES, type Tone } from "@/lib/content/defaults";
import { linkedInRow, socialRow } from "@/lib/content/drafts";
import { buildLearningNote } from "@/lib/content/text";
import { getBrandContext, logUsage } from "@/lib/data";
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
 * Writes the LinkedIn draft and its Instagram + Facebook caption in one AI request,
 * which costs less than two separate requests. The idea itself is never changed.
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

  let draft: CombinedDraft;
  let usage: AiUsage;
  try {
    const result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildLinkedInPrompt({
        idea: idea.raw_content,
        inputType: idea.input_type,
        tone: idea.tone,
        recentTitles: (recent ?? []).slice(0, 10).map((r) => r.title),
      }),
      schema: CombinedDraftSchema,
      maxTokens: 10000,
    });
    draft = result.data;
    usage = result.usage;
  } catch (error) {
    const code = error instanceof AiError ? error.code : "failed";
    await logUsage(supabase, owner.id, "linkedin_and_social_draft", null, code);
    redirect(`/inbox?error=ai-${code}`);
  }
  await logUsage(supabase, owner.id, "linkedin_and_social_draft", usage, "ok");

  const taken = (recent ?? [])
    .filter((r) => r.status !== "discarded" && r.scheduled_for)
    .map((r) => r.scheduled_for as string);

  const scheduledFor = nextPostingDate(lagosToday(), taken);
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      ...linkedInRow(draft.linkedin, brand),
      profile_id: owner.id,
      source_idea_id: idea.id,
      scheduled_for: scheduledFor,
      generation_metadata: {
        model: usage.model,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        voice_guide_used: Boolean(brand.voiceGuide),
      },
    })
    .select("id")
    .single();
  if (error || !post) redirect("/inbox?error=save");

  // The caption shares the LinkedIn post's date. If saving it fails, the LinkedIn
  // draft is still kept and the caption can be added from the draft page.
  await supabase.from("posts").insert({
    ...socialRow(draft.instagram_facebook, brand),
    profile_id: owner.id,
    parent_post_id: post.id,
    source_idea_id: idea.id,
    pillar: linkedInRow(draft.linkedin, brand).pillar,
    objective: draft.linkedin.objective.trim(),
    tone: draft.linkedin.tone.trim(),
    scheduled_for: scheduledFor,
    generation_metadata: { model: usage.model, shared_request_with: post.id },
  });

  await supabase.from("ideas").update({ status: "drafted" }).eq("id", idea.id);
  revalidatePath("/inbox");
  revalidatePath("/week");
  redirect(`/posts/${post.id}`);
}
