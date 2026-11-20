"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildLearningPrompt, buildSystemPrompt } from "@/lib/ai/prompts";
import { AiError, generateStructured } from "@/lib/ai/provider";
import { LearningSchema } from "@/lib/ai/schemas";
import { requireOwner } from "@/lib/auth/session";
import { acceptableRules, excerpt } from "@/lib/content/learning";
import { getBrandContext, logUsage } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/**
 * Reads recent ratings, notes and hand edits and suggests a few writing rules.
 * Suggestions do nothing until the author approves them.
 */
export async function learnFromFeedback() {
  const owner = await requireOwner();
  const supabase = await createClient();

  const [{ data: feedback }, { data: versions }, { data: rules }] = await Promise.all([
    supabase
      .from("feedback")
      .select("post_id, rating, comment, created_at")
      .eq("profile_id", owner.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("post_versions")
      .select("post_id, body, change_note, created_at")
      .eq("profile_id", owner.id)
      .eq("change_note", "Before the author's own edit")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("learning_notes").select("note, status").eq("profile_id", owner.id),
  ]);
  // Change requests she typed on drafts are feedback too.
  const { data: requested } = await supabase
    .from("posts")
    .select("structured_content")
    .eq("profile_id", owner.id)
    .eq("platform", "linkedin")
    .order("updated_at", { ascending: false })
    .limit(40);
  const instructions = (requested ?? [])
    .flatMap((p) => {
      const answers = (p.structured_content as { answers?: unknown } | null)?.answers;
      return Array.isArray(answers) ? answers : [];
    })
    .map((a) => (a && typeof a === "object" && typeof a.answer === "string" ? a.answer.trim().slice(0, 300) : ""))
    .filter(Boolean)
    .slice(0, 20);

  // A post's latest rating is the one that counts.
  const latest = new Map<string, { rating: "up" | "down"; comment: string }>();
  for (const f of feedback ?? []) if (!latest.has(f.post_id)) latest.set(f.post_id, f);
  const postIds = [...new Set([...latest.keys(), ...(versions ?? []).map((v) => v.post_id as string)])];
  if (latest.size + (versions?.length ?? 0) + instructions.length < 2) redirect("/settings?error=little-feedback#learning");

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, platform, body")
    .in("id", postIds);
  const byId = new Map((posts ?? []).map((p) => [p.id as string, p]));

  const feedbackItems = [...latest.entries()]
    .filter(([id]) => byId.has(id))
    .map(([id, f]) => {
      const post = byId.get(id)!;
      return { rating: f.rating, comment: f.comment, title: post.title, platform: post.platform, excerpt: excerpt(post.body) };
    });
  const editItems = (versions ?? [])
    .filter((v) => byId.has(v.post_id))
    .map((v) => ({ before: excerpt(v.body as string, 1200), after: excerpt(byId.get(v.post_id)!.body, 1200) }));

  const activeRules = (rules ?? []).filter((r) => r.status === "active").map((r) => r.note as string);
  const dismissedRules = (rules ?? []).filter((r) => r.status === "dismissed").map((r) => r.note as string);
  const pending = (rules ?? []).filter((r) => r.status === "suggested").map((r) => r.note as string);

  const brand = await getBrandContext(supabase, owner.id);
  let result;
  try {
    result = await generateStructured({
      system: buildSystemPrompt(brand),
      prompt: buildLearningPrompt({ feedback: feedbackItems, edits: editItems, instructions, activeRules, dismissedRules }),
      schema: LearningSchema,
      maxTokens: 4000,
    });
  } catch (error) {
    const code = error instanceof AiError ? error.code : "failed";
    await logUsage(supabase, owner.id, "learn_from_feedback", null, code);
    redirect(`/settings?error=ai-${code}#learning`);
  }
  await logUsage(supabase, owner.id, "learn_from_feedback", result.usage, "ok");

  const rows = acceptableRules(result.data.rules, [...activeRules, ...dismissedRules, ...pending]).map((r) => ({
    profile_id: owner.id,
    learning_type: r.type,
    note: r.note,
    reason: r.reason,
    evidence_count: r.evidence,
    status: "suggested",
  }));
  if (rows.length === 0) redirect("/settings?saved=nothing-learned#learning");
  const { error } = await supabase.from("learning_notes").insert(rows);
  if (error) redirect("/settings?error=save#learning");
  revalidatePath("/settings");
  redirect(`/settings?saved=learned#learning`);
}

/** Approve, dismiss or switch off a learned rule. */
export async function setRuleStatus(form: FormData) {
  await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  const status = z.enum(["active", "dismissed", "suggested"]).safeParse(text(form, "status"));
  if (!id.success || !status.success) redirect("/settings#learning");
  const supabase = await createClient();
  await supabase.from("learning_notes").update({ status: status.data }).eq("id", id.data);
  revalidatePath("/settings");
  redirect("/settings#learning");
}

/** A rule the author types herself. It is active straight away. */
export async function addOwnRule(form: FormData) {
  const owner = await requireOwner();
  const note = text(form, "note").replace(/\s+/g, " ").slice(0, 160);
  if (note.length < 4) redirect("/settings?error=rule#learning");
  const supabase = await createClient();
  const { error } = await supabase.from("learning_notes").insert({
    profile_id: owner.id,
    learning_type: "direct_instruction",
    note,
    reason: "Added by you",
    status: "active",
  });
  if (error) redirect("/settings?error=save#learning");
  revalidatePath("/settings");
  redirect("/settings?saved=rule#learning");
}
