import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { Notice } from "@/components/notice";
import { OutcomeButtons } from "@/components/outcome-buttons";
import { SubmitButton } from "@/components/submit-button";
import { btnDark, btnOkSelected, btnPrimary, btnSecondary, card, chip, field, h2, label } from "@/components/ui";
import { AI_ERROR_MESSAGES, type AiErrorCode } from "@/lib/ai/provider";
import { requireOwner } from "@/lib/auth/session";
import { PLATFORMS, type Platform } from "@/lib/content/defaults";
import { asStringArray } from "@/lib/content/text";
import { formatLong, lagosToday } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { addAdaptation, answerQuestion, rateDraft, setVisualChoice } from "../actions";

export const maxDuration = 120;

const VISUALS = [
  { value: "generate_image", title: "Design a graphic", note: "A clean designed card (coming soon)" },
  { value: "carousel", title: "Design a carousel", note: "Slides you can download (coming soon)" },
  { value: "own_photo", title: "I will use my own photo", note: "You add it on the platform" },
  { value: "none", title: "No visual", note: "Text only" },
];

function list(value: unknown): string[] {
  return asStringArray(value);
}

type Research = {
  status: string;
  checked_on: string | null;
  notes: string;
  sources: { title: string; url: string; age: string | null }[];
};

/** Reads the saved web-check record, keeping only well-formed http links. */
function readResearch(value: unknown): Research | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  const sources = Array.isArray(r.sources)
    ? r.sources
        .filter((s): s is { title?: unknown; url: string; age?: unknown } =>
          Boolean(s) && typeof s === "object" && typeof (s as { url?: unknown }).url === "string")
        .filter((s) => /^https?:\/\//.test(s.url))
        .map((s) => ({
          title: typeof s.title === "string" ? s.title : "",
          url: s.url,
          age: typeof s.age === "string" ? s.age : null,
        }))
    : [];
  return {
    status: typeof r.status === "string" ? r.status : "skipped",
    checked_on: typeof r.checked_on === "string" ? r.checked_on : null,
    notes: typeof r.notes === "string" ? r.notes : "",
    sources,
  };
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const owner = await requireOwner();
  const { id } = await params;
  const { saved, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!post || post.profile_id !== owner.id) notFound();

  const rootId: string = post.parent_post_id ?? post.id;
  const [{ data: family }, { data: idea }, { data: ratings }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, platform, parent_post_id")
      .or(`id.eq.${rootId},parent_post_id.eq.${rootId}`),
    post.source_idea_id
      ? supabase.from("ideas").select("raw_content, input_type").eq("id", post.source_idea_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("feedback")
      .select("rating, comment, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const versions = new Map<string, string>((family ?? []).map((p) => [p.platform, p.id]));
  const platform = post.platform as Platform;
  const hashtags = list(post.hashtags);
  const keywords = list(post.keywords);
  const altHooks = list(post.alt_hooks);
  const extra = (post.structured_content ?? {}) as Record<string, unknown>;
  const bannedFound = list(extra.banned_found);
  const research = readResearch(extra.research);
  const lastRating = ratings?.[0];
  const errorMessage = error
    ? error === "date"
      ? "Please choose a valid date."
      : error === "answer"
        ? "Please type an answer first."
      : error.startsWith("ai-")
        ? AI_ERROR_MESSAGES[error.slice(3) as AiErrorCode]
        : "That could not be saved. Please try again."
    : undefined;
  const copyText = platform === "tiktok" ? String(extra.caption ?? "") : post.body;

  return (
    <div className="flex max-w-[1000px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/week" className="flex min-h-11 items-center self-start font-medium text-muted">
          Back to this week
        </Link>
        <h1 className="font-display text-[28px] font-bold leading-tight">{post.title}</h1>
        <p className="text-muted">
          {post.scheduled_for ? formatLong(post.scheduled_for) : "No date yet"}
        </p>
        <div role="group" aria-label="Platform versions" className="flex flex-wrap gap-2 pt-2">
          {(Object.keys(PLATFORMS) as Platform[]).map((p) => {
            const versionId = versions.get(p);
            if (versionId) {
              return (
                <Link key={p} href={`/posts/${versionId}`} aria-current={p === platform ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-lg border px-4 font-semibold ${
                    p === platform ? "border-ink bg-ink text-white" : "border-line-strong bg-surface"
                  }`}>
                  {PLATFORMS[p]}
                </Link>
              );
            }
            return (
              <form key={p} action={addAdaptation}>
                <input type="hidden" name="id" value={rootId} />
                <input type="hidden" name="platform" value={p} />
                <SubmitButton pendingLabel="Writing… about 30 seconds"
                  className="inline-flex min-h-11 items-center rounded-lg border border-dashed border-[#8a919e] bg-surface px-4 font-semibold text-[#3a404b] disabled:opacity-60">
                  {p === "tiktok" ? "Add TikTok script" : `Add ${PLATFORMS[p]} version`}
                </SubmitButton>
              </form>
            );
          })}
        </div>
      </header>

      {saved === "rating" ? <Notice kind="ok">Thanks. Your rating is saved.</Notice> : null}
      {saved === "rewritten" ? (
        <Notice kind="ok">Draft rewritten with your answer. The earlier wording is saved.</Notice>
      ) : null}
      {errorMessage ? <Notice kind="warn">{errorMessage}</Notice> : null}
      {post.safety_status !== "clear" ? (
        <Notice kind="warn">
          Worth a look before posting: {post.review_notes || list(post.safety_reasons).join("; ")}
        </Notice>
      ) : null}
      {bannedFound.length ? (
        <Notice kind="warn">
          This draft uses a phrase from your never-use list: {bannedFound.join(", ")}.
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_440px] flex-col gap-5">
          <section aria-label="Post" className={`${card} flex flex-col gap-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={h2}>
                {platform === "tiktok" ? "Spoken script" : `${PLATFORMS[platform]} post`}
                {platform === "linkedin" ? (
                  <span className="font-normal text-muted"> · {post.length} form</span>
                ) : null}
              </h2>
              <CopyButton text={post.body} label={platform === "tiktok" ? "Copy script" : "Copy post"} className={btnPrimary} />
            </div>
            <div className="whitespace-pre-line rounded-lg bg-ground px-4.5 py-4 text-base leading-relaxed">
              {post.body}
            </div>
            <p className="text-sm text-muted">Line breaks are kept when you copy.</p>
          </section>

          {platform === "tiktok" ? (
            <section aria-label="Video plan" className={`${card} flex flex-col gap-4`}>
              <h2 className={h2}>Video plan · about {String(extra.duration_seconds ?? "?")} seconds</h2>
              {[
                { title: "Beats", items: list(extra.beats) },
                { title: "On-screen text", items: list(extra.on_screen_text) },
                { title: "Shots", items: list(extra.shots) },
              ].map((group) =>
                group.items.length ? (
                  <div key={group.title}>
                    <p className={label}>{group.title}</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {group.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                ) : null,
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ground px-4 py-3">
                <p className="min-w-0 flex-[1_1_280px] whitespace-pre-line text-sm">{copyText}</p>
                <CopyButton text={copyText} label="Copy caption" className={btnSecondary} />
              </div>
            </section>
          ) : null}

          {typeof extra.cover_text === "string" && extra.cover_text ? (
            <section aria-label="Cover text" className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div className="flex-[1_1_280px]">
                <h2 className={h2}>Text for the image or first slide</h2>
                <p className="mt-1">{extra.cover_text}</p>
              </div>
              <CopyButton text={extra.cover_text} label="Copy" className={btnSecondary} />
            </section>
          ) : null}

          {altHooks.length ? (
            <section aria-label="Alternative openings" className={`${card} flex flex-col gap-3`}>
              <h2 className={h2}>Two other ways to open</h2>
              {altHooks.map((hook) => (
                <div key={hook} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ground px-4 py-3">
                  <p className="min-w-0 flex-[1_1_280px]">{hook}</p>
                  <CopyButton text={hook} label="Copy" className={btnSecondary} />
                </div>
              ))}
            </section>
          ) : null}

          {platform === "linkedin" && typeof extra.clarifying_question === "string" && extra.clarifying_question ? (
            <section aria-label="A question from the AI" className={`${card} flex flex-col gap-2`}>
              <h2 className={h2}>One question that could make this stronger</h2>
              <form action={answerQuestion} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={post.id} />
                <label htmlFor="answer">{extra.clarifying_question}</label>
                <textarea id="answer" name="answer" rows={3} required className={field}
                  placeholder="A few words is enough. The draft is rewritten with your answer and the old wording is kept." />
                <div>
                  <SubmitButton className={btnDark} pendingLabel="Rewriting… up to a minute">Update the draft</SubmitButton>
                </div>
              </form>
            </section>
          ) : null}

          {hashtags.length ? (
            <section aria-label="Hashtags" className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div className="flex-[1_1_280px]">
                <h2 className={h2}>Hashtags</h2>
                <p className="mt-1 text-[#3a404b]">{hashtags.join(" ")}</p>
              </div>
              <CopyButton text={hashtags.join(" ")} label="Copy hashtags" className={btnSecondary} />
            </section>
          ) : null}

          {platform !== "tiktok" ? (
            <section aria-label="Visual" className={`${card} flex flex-col gap-3`}>
              <h2 className={h2}>Do you want a visual for this post?</h2>
              {post.format ? (
                <p className="text-sm text-muted">Suggested: {post.format}. {post.format_reason}</p>
              ) : null}
              <form action={setVisualChoice} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={post.id} />
                {VISUALS.map((v) => (
                  <button key={v.value} type="submit" name="choice" value={v.value}
                    aria-pressed={post.visual_choice === v.value}
                    className={`min-h-[72px] rounded-lg border bg-surface px-4 py-3 text-left ${
                      post.visual_choice === v.value ? "border-2 border-accent" : "border-line-strong"
                    }`}>
                    <span className="block font-semibold">{v.title}</span>
                    <span className="block text-[13px] text-muted">{v.note}</span>
                  </button>
                ))}
              </form>
            </section>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-[2_1_300px] flex-col gap-5">
          <section aria-label="What happens to this post" className={`${card} flex flex-col gap-3`}>
            <h2 className={h2}>What happens to this post?</h2>
            <OutcomeButtons postId={post.id} status={post.status} scheduledFor={post.scheduled_for}
              back={`/posts/${post.id}`} today={lagosToday()} />
          </section>

          {keywords.length ? (
            <section aria-label="Search optimisation" className={`${card} flex flex-col gap-2.5`}>
              <h2 className={h2}>Search optimisation</h2>
              <p className="text-sm text-muted">Keywords worked into the post so people searching can find it:</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((k) => <span key={k} className={chip}>{k}</span>)}
              </div>
            </section>
          ) : null}

          {research && research.status !== "skipped" ? (
            <section aria-label="What is current" className={`${card} flex flex-col gap-2.5`}>
              <h2 className={h2}>What is current</h2>
              {research.status === "done" ? (
                <>
                  <p className="text-sm text-muted">
                    Web checked on {research.checked_on ? formatLong(research.checked_on) : "the day it was written"}, before writing.
                  </p>
                  {research.sources.length ? (
                    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
                      {research.sources.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
                            {source.title || source.url}
                          </a>
                          {source.age ? <span className="text-muted"> · {source.age}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">The search found nothing recent and relevant.</p>
                  )}
                  {research.notes ? (
                    <details className="rounded-lg bg-ground p-3 text-sm">
                      <summary className="cursor-pointer font-semibold">What the search found</summary>
                      <p className="mt-2 whitespace-pre-line">{research.notes}</p>
                    </details>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-warn">
                  {research.status === "over_budget"
                    ? "The web check was skipped because your monthly AI budget is used up."
                    : "The web check did not work this time, so this draft was written without it."}
                </p>
              )}
            </section>
          ) : null}

          <section aria-label="About this draft" className={`${card} flex flex-col gap-3`}>
            <h2 className={h2}>About this draft</h2>
            <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              {[
                ["Pillar", post.pillar],
                ["Objective", post.objective],
                ["Tone", post.tone],
                ["Format", [post.format, post.format_reason].filter(Boolean).join(". ")],
              ].map(([name, value]) =>
                value ? (
                  <div key={name} className="contents">
                    <dt className="text-muted">{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            {idea ? (
              <details className="rounded-lg bg-ground p-3 text-sm">
                <summary className="cursor-pointer font-semibold">Your original idea</summary>
                <p className="mt-2 whitespace-pre-line">{idea.raw_content}</p>
              </details>
            ) : null}
          </section>

          <section aria-label="Your feedback" className={`${card} flex flex-col gap-3`}>
            <h2 className={h2}>Does this sound like you?</h2>
            {lastRating?.comment ? (
              <p className="text-sm text-muted">Your note: &ldquo;{lastRating.comment}&rdquo;</p>
            ) : null}
            <form action={rateDraft} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={post.id} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="comment" className={label}>Why? (optional)</label>
                <input id="comment" name="comment" type="text" className={`${field} min-h-11`}
                  placeholder="For example: too formal, good opening" />
              </div>
              <div className="flex gap-2">
                <button type="submit" name="rating" value="up" aria-pressed={lastRating?.rating === "up"}
                  className={lastRating?.rating === "up" ? btnOkSelected : btnSecondary}>
                  {lastRating?.rating === "up" ? "Liked" : "Like it"}
                </button>
                <button type="submit" name="rating" value="down" aria-pressed={lastRating?.rating === "down"}
                  className={lastRating?.rating === "down" ? btnDark : btnSecondary}>
                  {lastRating?.rating === "down" ? "Not for me (selected)" : "Not for me"}
                </button>
              </div>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
