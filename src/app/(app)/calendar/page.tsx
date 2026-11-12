import Link from "next/link";
import { OutcomeButtons } from "@/components/outcome-buttons";
import { btnSecondary, card, chipDark, h1, h2 } from "@/components/ui";
import { requireOwner } from "@/lib/auth/session";
import { PLATFORMS, type Platform } from "@/lib/content/defaults";
import {
  addDays,
  addMonths,
  formatDate,
  formatDay,
  formatMonth,
  isValidMonth,
  lagosToday,
  monthGrid,
} from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  platform: Platform;
  title: string;
  status: string;
  scheduled_for: string;
};

const SHORT: Record<Platform, string> = {
  linkedin: "LinkedIn",
  instagram_facebook: "IG + FB",
  tiktok: "TikTok",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string }>;
}) {
  const owner = await requireOwner();
  const { month: requested } = await searchParams;
  const today = lagosToday();
  const month = requested && isValidMonth(requested) ? requested : today.slice(0, 7);
  const cells = monthGrid(month);
  const first = `${month}-01`;
  const last = addDays(`${addMonths(month, 1)}-01`, -1);
  const back = month === today.slice(0, 7) ? "/calendar" : `/calendar?month=${month}`;

  const supabase = await createClient();
  const columns = "id, platform, title, status, scheduled_for";
  const [{ data: inMonth }, { data: waiting }] = await Promise.all([
    supabase
      .from("posts")
      .select(columns)
      .eq("profile_id", owner.id)
      .neq("status", "discarded")
      .gte("scheduled_for", first)
      .lte("scheduled_for", last)
      .order("created_at"),
    supabase
      .from("posts")
      .select(columns)
      .eq("profile_id", owner.id)
      .eq("status", "planned")
      .not("scheduled_for", "is", null)
      .order("scheduled_for")
      .limit(40),
  ]);
  const byDate = new Map<string, Row[]>();
  for (const post of (inMonth ?? []) as Row[]) {
    byDate.set(post.scheduled_for, [...(byDate.get(post.scheduled_for) ?? []), post]);
  }
  const queue = (waiting ?? []) as Row[];
  const overdue = queue.filter((p) => p.scheduled_for < today);
  const upcoming = queue.filter((p) => p.scheduled_for >= today);

  const Item = ({ post }: { post: Row }) => (
    <article className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4">
      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={chipDark}>{PLATFORMS[post.platform]}</span>
          <span className="text-sm text-muted">
            {formatDay(post.scheduled_for)} {formatDate(post.scheduled_for)}
          </span>
        </div>
        <Link href={`/posts/${post.id}`} className="font-semibold underline">{post.title}</Link>
      </div>
      <OutcomeButtons postId={post.id} status={post.status} scheduledFor={post.scheduled_for} back={back} today={today} />
    </article>
  );

  return (
    <div className="flex max-w-[960px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={h1}>Calendar</h1>
          <p className="mt-1 text-muted">Everything you have scheduled or posted. Move a post to any date.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?month=${addMonths(month, -1)}`} className={btnSecondary}>Previous</Link>
          <span className="px-2 font-semibold">{formatMonth(month)}</span>
          <Link href={`/calendar?month=${addMonths(month, 1)}`} className={btnSecondary}>Next</Link>
        </div>
      </header>

      <section aria-label="Month view" className={`${card} flex flex-col gap-3 !p-4`}>
        <div className="flex flex-wrap gap-4 text-[13px]">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-ok" />Posted</span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] border border-[#23449f] bg-[#c9d6f7]" />Scheduled
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-1.5 py-1 text-[13px] font-semibold text-muted">{d}</div>
            ))}
            {cells.map((date, i) => (
              <div key={date ?? `blank-${i}`}
                className={`flex min-h-[92px] flex-col gap-1 rounded-lg border p-1.5 ${
                  date === today ? "border-2 border-accent" : "border-line"
                } ${date ? "" : "bg-ground"}`}>
                {date ? (
                  <>
                    <div className="text-[13px] font-semibold">{Number(date.slice(8))}</div>
                    {(byDate.get(date) ?? []).map((post) => (
                      <Link key={post.id} href={`/posts/${post.id}`} title={post.title}
                        className={`truncate rounded px-1.5 py-0.5 text-xs font-semibold ${
                          post.status === "posted"
                            ? "bg-ok text-white"
                            : "border border-[#23449f] bg-[#e4eafb] text-[#23449f]"
                        }`}>
                        {SHORT[post.platform]}
                      </Link>
                    ))}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {overdue.length ? (
        <section aria-label="Past their date" className="flex flex-col gap-3">
          <h2 className={h2}>Past their date, not marked yet</h2>
          {overdue.map((post) => <Item key={post.id} post={post} />)}
        </section>
      ) : null}

      <section aria-label="Scheduled and waiting" className="flex flex-col gap-3">
        <h2 className={h2}>Scheduled and waiting</h2>
        {upcoming.length ? (
          upcoming.map((post) => <Item key={post.id} post={post} />)
        ) : (
          <p className={`${card} text-muted`}>Nothing is waiting. New drafts appear here with their dates.</p>
        )}
      </section>

      <p className="text-sm text-muted">
        Scheduling here is your own plan. You still copy and paste each post yourself. Posting directly
        from the app is planned for version 2.
      </p>
    </div>
  );
}
