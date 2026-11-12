"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildSystemPrompt, buildVoiceGuidePrompt } from "@/lib/ai/prompts";
import { AiError, generateStructured, type AiUsage } from "@/lib/ai/provider";
import { VoiceGuideSchema } from "@/lib/ai/schemas";
import { requireOwner } from "@/lib/auth/session";
import { parseLines } from "@/lib/content/text";
import { getBrandContext, logUsage } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function saveSettings(form: FormData) {
  const owner = await requireOwner();
  const supabase = await createClient();

  const budgetRaw = text(form, "budget");
  const budget = budgetRaw === "" ? null : Number(budgetRaw);
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 10000)) {
    redirect("/settings?error=budget");
  }

  const { error } = await supabase.from("brand_settings").upsert({
    profile_id: owner.id,
    positioning: text(form, "positioning").slice(0, 500),
    professional_bio: text(form, "bio").slice(0, 3000),
    audience_priorities: parseLines(text(form, "audience"), 30),
    pillars: parseLines(text(form, "pillars"), 20),
    keyword_library: parseLines(text(form, "keywords"), 80),
    banned_phrases: parseLines(text(form, "banned"), 80),
    monthly_ai_budget: budget,
  });
  if (error) redirect("/settings?error=save");
  revalidatePath("/settings");
  redirect("/settings?saved=settings");
}

const SampleSchema = z.object({
  category: z.enum(["writing_sample", "style_reference"]),
  content: z.string().min(20).max(6000),
});

export async function addSample(form: FormData) {
  const owner = await requireOwner();
  const parsed = SampleSchema.safeParse({
    category: text(form, "category"),
    content: text(form, "content"),
  });
  if (!parsed.success) redirect("/settings?error=sample#voice");

  const supabase = await createClient();
  const { error } = await supabase.from("brand_knowledge").insert({
    profile_id: owner.id,
    category: parsed.data.category,
    content: parsed.data.content,
  });
  if (error) redirect("/settings?error=save#voice");
  revalidatePath("/settings");
  redirect("/settings?saved=sample#voice");
}

export async function deleteSample(form: FormData) {
  await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/settings#voice");
  const supabase = await createClient();
  await supabase.from("brand_knowledge").delete().eq("id", id.data);
  revalidatePath("/settings");
  redirect("/settings#voice");
}

/** Writes a new voice guide version from the saved samples. It stays inactive until approved. */
export async function createVoiceGuide() {
  const owner = await requireOwner();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("brand_knowledge")
    .select("category, content")
    .eq("profile_id", owner.id)
    .eq("active", true)
    .order("created_at");
  const samples = (rows ?? []).filter((r) => r.category === "writing_sample").map((r) => r.content);
  const references = (rows ?? [])
    .filter((r) => r.category === "style_reference")
    .map((r) => r.content);
  if (samples.length < 3) redirect("/settings?error=few-samples#voice");

  const brand = await getBrandContext(supabase, owner.id);
  let usage: AiUsage | null = null;
  let guide: string;
  let summary: string;
  try {
    const result = await generateStructured({
      system: buildSystemPrompt({ ...brand, voiceGuide: null }),
      prompt: buildVoiceGuidePrompt(samples, references),
      schema: VoiceGuideSchema,
      maxTokens: 6000,
    });
    usage = result.usage;
    guide = result.data.guide.trim();
    summary = result.data.summary.trim();
  } catch (error) {
    const code = error instanceof AiError ? error.code : "failed";
    await logUsage(supabase, owner.id, "voice_guide", null, code);
    redirect(`/settings?error=ai-${code}#voice`);
  }
  await logUsage(supabase, owner.id, "voice_guide", usage, "ok");

  const { data: latest } = await supabase
    .from("voice_guides")
    .select("version")
    .eq("profile_id", owner.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("voice_guides").insert({
    profile_id: owner.id,
    version: (latest?.version ?? 0) + 1,
    guide_content: guide,
    change_summary: summary,
    active: false,
  });
  if (error) redirect("/settings?error=save#voice");
  revalidatePath("/settings");
  redirect("/settings?saved=guide#voice");
}

export async function approveVoiceGuide(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/settings#voice");
  const supabase = await createClient();
  await supabase.from("voice_guides").update({ active: false }).eq("profile_id", owner.id);
  await supabase.from("voice_guides").update({ active: true }).eq("id", id.data);
  revalidatePath("/settings");
  redirect("/settings?saved=approved#voice");
}
