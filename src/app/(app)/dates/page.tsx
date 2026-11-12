import Link from "next/link";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { btnDark, btnPrimary, btnSecondary, card, chip, h1, h2 } from "@/components/ui";
import { AI_ERROR_MESSAGES, type AiErrorCode } from "@/lib/ai/provider";
import { requireOwner } from "@/lib/auth/session";
import { formatLong, lagosToday } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { draftForDate, findDates, skipDate } from "./actions";

export const maxDuration = 120;

const CATEGORY: Record<string, string> = {
  public_holiday: "Public holiday",
  tech_observance: "Tech observance",
  tech_event: "Tech event",
  cultural: "Cultural occasion",
  global: "Global occasion",
};
const ERRORS: Record<string, string> = {
  budget: "You have reached your monthly AI budget, so web searches are paused. Raise the budget in Settings to continue.",
  nothing: "The search did not find any confirmed dates this time. Try again later.",
  save: "That could not be saved. Please try again.",
};

type EventRow = {
  id: string;
  event_date: string;
  name: string;
  category: string;
  geography: string;
  source_url: string;
  source_title: string;
  relevance_reason: string;
  suggested_angle: string;
  status: string;
  post_id: string | null;
};

export default async function DatesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const owner = await requireOwner();
  const { saved, error } = await searchParams;
  const today = lagosToday();
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("id, event_date, name, category, geography, source_url, source_title, relevance_reason, suggested_angle, status, post_id")
    .eq("profile_id", owner.id)
    .gte("event_date", today)
    .order("event_date")
    .limit(60);
  const events = (data ?? []) as EventRow[];
  const shown = events.filter((e) => e.status !== "skipped");
  const skipped = events.filter((e) => e.status === "skipped");
  const message = error
    ? error.startsWith("ai-")
      ? AI_ERROR_MESSAGES[error.slice(3) as AiErrorCode]
      : ERRORS[error]
    : undefined;

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex-[1_1_320px]">
          <h1 className={h1}>Holidays and key dates</h1>
          <p className="mt-1 text-muted">
            Upcoming Nigerian holidays, global occasions and tech days for the next ten weeks. Each
            date is confirmed by a web page you can open.
          </p>
        </div>
        <form action={findDates}>
          <SubmitButton className={btnDark} pendingLabel="Searching… about a minute">
            {events.length ? "Check for new dates" : "Find upcoming dates"}
          </SubmitButton>
        </form>
      </header>

      {saved === "found" ? <Notice kind="ok">Dates updated. Review them below.</Notice> : null}
      {message ? <Notice kind="warn">{message}</Notice> : null}

      {shown.length === 0 ? (
        <p className={`${card} text-muted`}>
          No dates yet. Press the button above and the AI will search the web for what is coming up.
          This uses a little more credit than a draft.
        </p>
      ) : null}

      <section aria-label="Upcoming dates" className="flex flex-col gap-4">
        {shown.map((event) => (
          <article key={event.id} className={`${card} flex flex-col gap-3 !p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{event.name}</h2>
              <span className="text-sm text-muted">{formatLong(event.event_date)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={chip}>{CATEGORY[event.category] ?? event.category}</span>
              {event.geography ? <span className={chip}>{event.geography}</span> : null}
            </div>
            {event.suggested_angle ? (
              <p className="text-sm text-[#3a404b]">Suggested angle: {event.suggested_angle}</p>
            ) : null}
            <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-muted underline">
              Date confirmed by: {event.source_title || event.source_url}
            </a>
            {event.post_id ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#e4eafb] px-3 py-1.5 text-[13px] font-semibold text-[#23449f]">
                  Drafted and scheduled for this date
                </span>
                <Link href={`/posts/${event.post_id}`} className="flex min-h-11 items-center font-semibold underline">
                  Review the drafts
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <form action={draftForDate}>
                  <input type="hidden" name="id" value={event.id} />
                  <SubmitButton className={btnPrimary} pendingLabel="Writing… up to a minute">
                    Generate and schedule posts
                  </SubmitButton>
                </form>
                <form action={skipDate}>
                  <input type="hidden" name="id" value={event.id} />
                  <button type="submit" className={btnSecondary}>Skip this date</button>
                </form>
              </div>
            )}
          </article>
        ))}
      </section>

      {skipped.length ? (
        <details className={`${card} !p-5`}>
          <summary className={`${h2} cursor-pointer`}>Skipped dates ({skipped.length})</summary>
          <ul className="mt-3 flex flex-col gap-2">
            {skipped.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>{event.name} · {formatLong(event.event_date)}</span>
                <form action={skipDate}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="undo" value="1" />
                  <button type="submit" className="min-h-11 underline">Bring back</button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="text-sm text-muted">
        Generating writes the LinkedIn post and the Instagram + Facebook caption and puts them on the
        calendar for that day. You still review and post them yourself. Some holiday dates are
        provisional until officially announced, so open the link to check.
      </p>
    </div>
  );
}
