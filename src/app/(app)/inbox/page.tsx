import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { btnDanger, btnPrimary, btnSecondary, card, chip, h1, h2 } from "@/components/ui";
import { AI_ERROR_MESSAGES, type AiErrorCode } from "@/lib/ai/provider";
import { requireOwner } from "@/lib/auth/session";
import { STANDARD_PROMPT, TONES, type Tone } from "@/lib/content/defaults";
import { createClient } from "@/lib/supabase/server";
import { archiveIdea, createDraft } from "./actions";
import { IdeaForm } from "./idea-form";

export const maxDuration = 120;

const ERRORS: Record<string, string> = {
  short: "Please write a little more, at least a sentence.",
  long: "That is very long. Please shorten it to the main points.",
  save: "That could not be saved. Please try again.",
  missing: "That idea could not be found.",
};
const STATUS: Record<string, string> = {
  new: "New",
  needs_clarification: "Needs a detail",
  drafted: "Drafted",
  planned: "Planned",
  used: "Used",
};

function errorText(code: string | undefined) {
  if (!code) return undefined;
  if (code.startsWith("ai-")) return AI_ERROR_MESSAGES[code.slice(3) as AiErrorCode] ?? ERRORS.save;
  return ERRORS[code];
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const owner = await requireOwner();
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const [{ data: ideas }, { data: posts }] = await Promise.all([
    supabase
      .from("ideas")
      .select("id, raw_content, input_type, tone, status, created_at")
      .eq("profile_id", owner.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("posts")
      .select("id, source_idea_id")
      .eq("profile_id", owner.id)
      .eq("platform", "linkedin")
      .not("source_idea_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);
  const draftFor = new Map<string, string>();
  for (const p of posts ?? []) if (!draftFor.has(p.source_idea_id)) draftFor.set(p.source_idea_id, p.id);
  const message = errorText(error);

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <header>
        <h1 className={h1}>Idea Inbox</h1>
        <p className="mt-1 text-muted">
          Drop in a rough thought or a learning note. Your original words are always kept.
        </p>
      </header>

      {saved === "idea" ? <Notice kind="ok">Idea saved. Press Create draft when you are ready.</Notice> : null}
      {message ? <Notice kind="warn">{message}</Notice> : null}

      <section aria-label="Add an idea" className={card}>
        <IdeaForm />
      </section>

      <section aria-label="Standard prompt" className={`${card} flex flex-col gap-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={h2}>Turn an AI chat into a learning note</h2>
          <CopyButton text={STANDARD_PROMPT} label="Copy prompt" className={btnSecondary} />
        </div>
        <p className="text-sm text-muted">
          Paste this at the end of any AI work session, then paste the answer above as a learning note.
        </p>
        <pre className="whitespace-pre-wrap rounded-lg bg-ground px-4 py-3.5 font-mono text-[13px] leading-relaxed text-[#3a404b]">
          {STANDARD_PROMPT}
        </pre>
      </section>

      <section aria-label="Saved ideas" className="flex flex-col gap-3">
        <h2 className={h2}>Saved ideas</h2>
        {(ideas ?? []).length === 0 ? (
          <p className={`${card} text-muted`}>Nothing here yet. Add your first idea above.</p>
        ) : null}
        {(ideas ?? []).map((idea) => {
          const draftId = draftFor.get(idea.id);
          return (
            <article key={idea.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4">
              <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2">
                <p className="line-clamp-4 whitespace-pre-line">{idea.raw_content}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={chip}>{idea.input_type === "learning_note" ? "Learning note" : "Quick thought"}</span>
                  <span className={chip}>{TONES[idea.tone as Tone] ?? TONES.auto}</span>
                  <span className={`${chip} font-semibold`}>{STATUS[idea.status] ?? idea.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {draftId ? (
                  <Link href={`/posts/${draftId}`} className={btnSecondary}>View draft</Link>
                ) : null}
                <form action={createDraft}>
                  <input type="hidden" name="id" value={idea.id} />
                  <SubmitButton className={draftId ? btnSecondary : btnPrimary} pendingLabel="Writing… about 30 seconds">
                    {draftId ? "Write another" : "Create draft"}
                  </SubmitButton>
                </form>
                <form action={archiveIdea}>
                  <input type="hidden" name="id" value={idea.id} />
                  <button type="submit" className={btnDanger}>Archive</button>
                </form>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
