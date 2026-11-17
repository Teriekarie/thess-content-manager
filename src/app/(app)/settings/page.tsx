import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { btnDanger, btnDark, btnPrimary, btnSecondary, card, field, h1, h2, label } from "@/components/ui";
import { AI_ERROR_MESSAGES, aiConfigured, aiModel, type AiErrorCode } from "@/lib/ai/provider";
import { requireOwner } from "@/lib/auth/session";
import { getBrandSettings, monthSpend } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { addOwnRule, learnFromFeedback, setRuleStatus } from "./learning-actions";
import {
  addSample,
  approveVoiceGuide,
  createVoiceGuide,
  deleteSample,
  saveSettings,
} from "./actions";

export const maxDuration = 120;

const SAVED: Record<string, string> = {
  learned: "New suggestions are ready below. Approve the ones that sound right.",
  "nothing-learned": "No clear pattern yet. Keep rating drafts and adding a note on why, then try again.",
  rule: "Rule added. New drafts will follow it.",
  settings: "Settings saved.",
  sample: "Sample saved.",
  guide: "A new voice guide is ready below. Read it, then approve it to start using it.",
  approved: "Voice guide approved. New drafts will use it.",
};
const ERRORS: Record<string, string> = {
  "little-feedback": "Rate a few more drafts first (at least two), ideally with a short note on why.",
  rule: "Please type a rule of a few words.",
  budget: "The monthly budget must be a number, for example 10.",
  save: "That could not be saved. Please try again.",
  sample: "A sample needs at least a sentence or two (20 characters).",
  "few-samples": "Add at least 3 of your own writing samples first. 5 to 10 works best.",
};

function errorText(code: string | undefined) {
  if (!code) return undefined;
  if (code.startsWith("ai-")) return AI_ERROR_MESSAGES[code.slice(3) as AiErrorCode] ?? ERRORS.save;
  return ERRORS[code];
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const owner = await requireOwner();
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const [settings, spend, samplesResult, guidesResult, rulesResult, feedbackCount] = await Promise.all([
    getBrandSettings(supabase, owner.id),
    monthSpend(supabase, owner.id),
    supabase
      .from("brand_knowledge")
      .select("id, category, content")
      .eq("profile_id", owner.id)
      .order("created_at"),
    supabase
      .from("voice_guides")
      .select("id, version, guide_content, change_summary, active")
      .eq("profile_id", owner.id)
      .order("version", { ascending: false })
      .limit(5),
    supabase
      .from("learning_notes")
      .select("id, note, reason, evidence_count, status, learning_type")
      .eq("profile_id", owner.id)
      .neq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("profile_id", owner.id),
  ]);
  const rules = rulesResult.data ?? [];
  const suggested = rules.filter((r) => r.status === "suggested");
  const activeRules = rules.filter((r) => r.status === "active");
  const samples = samplesResult.data ?? [];
  const guides = guidesResult.data ?? [];
  const active = guides.find((g) => g.active);
  const pending = guides.find((g) => !g.active && (!active || g.version > active.version));
  const ownCount = samples.filter((s) => s.category === "writing_sample").length;
  const message = errorText(error);

  return (
    <div className="flex max-w-[1240px] flex-col gap-6">
      <header>
        <h1 className={h1}>Settings</h1>
        <p className="mt-1 text-muted">
          Who you are and how you write. Every draft is built from what you save here.
        </p>
      </header>

      {saved && SAVED[saved] ? <Notice kind="ok">{SAVED[saved]}</Notice> : null}
      {message ? <Notice kind="warn">{message}</Notice> : null}
      {!settings.saved ? (
        <Notice kind="warn">
          These are starting values from your plan. Edit anything, then press Save settings.
        </Notice>
      ) : null}

      <form action={saveSettings} className={`${card} flex flex-col gap-5`}>
        <h2 className={h2}>Your brand</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="positioning" className={label}>Positioning</label>
          <input id="positioning" name="positioning" defaultValue={settings.positioning} className={field} />
        </div>
        <div className="flex flex-col gap-1.5 md:max-w-[320px]">
          <label htmlFor="handle" className={label}>Your handle (shown on graphics)</label>
          <input id="handle" name="handle" defaultValue={settings.handle} placeholder="@yourname" className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className={label}>Short professional bio</label>
          <textarea id="bio" name="bio" rows={4} defaultValue={settings.bio} className={field}
            placeholder="What you do, the tools you use often, what you are learning. Plain words are fine." />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="audience" className={label}>Audience (one per line)</label>
            <textarea id="audience" name="audience" rows={8} defaultValue={settings.audience.join("\n")} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pillars" className={label}>Content pillars (one per line)</label>
            <textarea id="pillars" name="pillars" rows={8} defaultValue={settings.pillars.join("\n")} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="keywords" className={label}>Search keywords (one per line)</label>
            <textarea id="keywords" name="keywords" rows={8} defaultValue={settings.keywords.join("\n")} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="banned" className={label}>Phrases never to use (one per line)</label>
            <textarea id="banned" name="banned" rows={8} defaultValue={settings.bannedPhrases.join("\n")} className={field} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 md:max-w-[280px]">
          <label htmlFor="budget" className={label}>Monthly AI budget in US dollars (optional)</label>
          <input id="budget" name="budget" type="number" min="0" step="1" inputMode="decimal"
            defaultValue={settings.monthlyBudget ?? ""} className={field} />
        </div>
        <div><SubmitButton className={btnPrimary} pendingLabel="Saving…">Save settings</SubmitButton></div>
      </form>

      <section className={`${card} flex flex-col gap-3`}>
        <h2 className={h2}>AI connection</h2>
        <dl className="grid grid-cols-[160px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Status</dt>
          <dd>{aiConfigured() ? "Connected" : "Not connected. Add ANTHROPIC_API_KEY in Vercel, then redeploy."}</dd>
          <dt className="text-muted">Model</dt>
          <dd>{aiModel()}</dd>
          <dt className="text-muted">Spent this month</dt>
          <dd>
            About ${spend.toFixed(2)}
            {settings.monthlyBudget ? ` of your $${settings.monthlyBudget} budget` : ""} (an estimate; the
            Anthropic console shows the real bill)
          </dd>
        </dl>
      </section>

      <section id="learning" className={`${card} flex flex-col gap-5`}>
        <div>
          <h2 className={h2}>What the app has learned from you</h2>
          <p className="mt-1 text-sm text-muted">
            Your ratings, the notes you add to them, and your own edits teach the app what you like.
            A note on a rating is enough: you do not need to rewrite the draft. Nothing changes until
            you approve it.
          </p>
        </div>

        <form action={learnFromFeedback} className="flex flex-wrap items-center gap-3">
          <SubmitButton className={btnDark} pendingLabel="Reading your feedback…">
            Learn from my feedback
          </SubmitButton>
          <p className="text-sm text-muted">
            {feedbackCount.count ?? 0} rating{feedbackCount.count === 1 ? "" : "s"} so far. Costs a few cents.
          </p>
        </form>

        {suggested.length ? (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Suggestions waiting for you</p>
            {suggested.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft p-4">
                <div className="min-w-0 flex-[1_1_300px]">
                  <p className="font-semibold">{r.note}</p>
                  <p className="text-sm text-muted">
                    {r.reason}
                    {r.learning_type !== "direct_instruction" ? ` (seen ${r.evidence_count} times)` : ""}
                  </p>
                </div>
                <form action={setRuleStatus} className="flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" name="status" value="active" className={btnPrimary}>Use this</button>
                  <button type="submit" name="status" value="dismissed" className={btnSecondary}>Not for me</button>
                </form>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <p className="font-semibold">Rules in use ({activeRules.length})</p>
          {activeRules.length === 0 ? (
            <p className="text-sm text-muted">None yet. Approve a suggestion or add your own below.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeRules.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ground px-4 py-2">
                  <span className="min-w-0 flex-[1_1_260px]">{r.note}</span>
                  <form action={setRuleStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" name="status" value="dismissed" className="min-h-11 text-sm underline">
                      Stop using
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addOwnRule} className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
              <label htmlFor="own-rule" className={label}>Add your own rule</label>
              <input id="own-rule" name="note" maxLength={160} className={field}
                placeholder="For example: never start a post with a question" />
            </div>
            <SubmitButton className={btnSecondary} pendingLabel="Saving…">Add rule</SubmitButton>
          </form>
        </div>
      </section>

      <section id="voice" className={`${card} flex flex-col gap-5`}>
        <div>
          <h2 className={h2}>Your voice</h2>
          <p className="mt-1 text-sm text-muted">
            Paste 5 to 10 things you wrote yourself: past posts, captions, messages, notes. You can
            also add 2 or 3 posts by other people whose style you like. Their words are never copied.
          </p>
        </div>

        <form action={addSample} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="content" className={label}>Paste one sample</label>
            <textarea id="content" name="content" rows={5} required className={field} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className={label}>This is</label>
              <select id="category" name="category" className={`${field} min-h-11`}>
                <option value="writing_sample">My own writing</option>
                <option value="style_reference">A style reference, not my words</option>
              </select>
            </div>
            <SubmitButton className={btnSecondary} pendingLabel="Saving…">Add sample</SubmitButton>
          </div>
        </form>

        {samples.length ? (
          <ul className="flex flex-col gap-2">
            {samples.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-ground px-4 py-3">
                <div className="min-w-0 flex-[1_1_300px]">
                  <p className="text-[13px] font-semibold text-muted">
                    {s.category === "writing_sample" ? "My own writing" : "Style reference"}
                  </p>
                  <p className="truncate text-sm">{s.content}</p>
                </div>
                <form action={deleteSample}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className={btnDanger}>Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}

        <form action={createVoiceGuide} className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <SubmitButton className={btnDark} pendingLabel="Reading your samples…">
            {guides.length ? "Rewrite my voice guide" : "Create my voice guide"}
          </SubmitButton>
          <p className="text-sm text-muted">
            {ownCount} of your own samples saved. At least 3 are needed.
          </p>
        </form>

        {pending ? (
          <div className="flex flex-col gap-3 rounded-lg border border-accent p-4">
            <p className="font-semibold">Voice guide version {pending.version} (waiting for your approval)</p>
            <p className="text-sm text-muted">{pending.change_summary}</p>
            <p className="whitespace-pre-line text-sm">{pending.guide_content}</p>
            <form action={approveVoiceGuide}>
              <input type="hidden" name="id" value={pending.id} />
              <SubmitButton className={btnPrimary} pendingLabel="Saving…">Approve this voice guide</SubmitButton>
            </form>
          </div>
        ) : null}

        {active ? (
          <details className="rounded-lg bg-ground p-4">
            <summary className="cursor-pointer font-semibold">
              Voice guide in use: version {active.version}
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm">{active.guide_content}</p>
          </details>
        ) : (
          <p className="text-sm text-muted">
            No voice guide is in use yet. Drafts will use a general warm, direct style until you approve one.
          </p>
        )}
      </section>
    </div>
  );
}
