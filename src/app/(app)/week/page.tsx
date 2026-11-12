import Link from "next/link";
import { Notice } from "@/components/notice";
import { OutcomeButtons } from "@/components/outcome-buttons";
import { btnDark, btnPrimary, btnSecondary, card, chip, platformChip, h1, h2 } from "@/components/ui";
import { requireOwner } from "@/lib/auth/session";
import { PLATFORMS, type Platform } from "@/lib/content/defaults";
import {
  addDays,
  formatDate,
  formatDay,
  isValidDate,
  lagosToday,
  weekDates,
  weekStart,
} from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { generatePlan } from "./actions";

export const maxDuration = 120;

type Row = {
  id: string;
  platform: Platform;
  title: string;
  format: string;
  length: string;
  visual_choice: string | null;
  status: string;
  scheduled_for: string | null;
  carried_over_count: number;
};

const VISUAL: Record<string, string> = {
  generate_image: "Designed graphic",
  carousel: "Carousel design",
  own_photo: "Your own photo",
  none: "No visual",
};
const ORDER: Platform[] = ["linkedin", "instagram_facebook", "tiktok"];

function describePlan(plan: string | undefined): { kind: "ok" | "warn"; text: string } | null {
  if (!plan) return null;
  if (plan === "full") return { kind: "ok", text: "Every posting day in this week already has a post." };
  if (plan === "no-ideas") {
    return { kind: "warn", text: "There are no new ideas to draft from. Add some in the Idea Inbox first." };
  }
  const match = plan.match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  const made = Number(match[1]);
  const failed = Number(match[2]);
  if (failed === 0) return { kind: "ok", text: `${made} draft${made === 1 ? "" : "s"} added to this week.` };
  return {
    kind: "warn",
    text: `${made} draft${made === 1 ? "" : "s"} added. ${failed} could not be written, so the plan is partial. Press the button again to retry.`,
  };
}

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; error?: string; plan?: string }>;
}) {
  const owner = await requireOwner();
  const { week, error, plan } = await searchParams;
  const today = lagosToday();
  const start = weekStart(week && isValidDate(week) ? week : today);
  const days = weekDates(start);
  const isThisWeek = start === weekStart(today);
  const back = isThisWeek ? "/week" : `/week?week=${start}`;

  const supabase = await createClient();
  const columns = "id, platform, title, format, length, visual_choice, status, scheduled_for, carried_over_count";
  const [{ data: inWeek }, { data: undated }] = await Promise.all([
    supabase
      .from("posts")
      .select(columns)
      .eq("profile_id", owner.id)
      .gte("scheduled_for", start)
      .lte("scheduled_for", days[6])
      .order("created_at"),
    supabase
      .from("posts")
      .select(columns)
      .eq("profile_id", owner.id)
      .is("scheduled_for", null)
      .eq("status", "planned")
      .order("created_at"),
  ]);
  const posts = (inWeek ?? []) as Row[];
  const active = posts.filter((p) => p.status !== "discarded");
  const counts = ORDER.map((p) => `${PLATFORMS[p]} ${active.filter((x) => x.platform === p).length}`);

  const planMessage = describePlan(plan);

  const Card = ({ post }: { post: Row }) => (
    <article className={`flex flex-wrap gap-4 rounded-xl border border-line bg-surface p-5 ${
      post.status === "discarded" ? "opacity-70" : ""
    }`}>
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={platformChip(post.platform)}>{PLATFORMS[post.platform]}</span>
          {post.format ? <span className={chip}>{post.format}</span> : null}
          {post.platform === "linkedin" ? <span className={chip}>{post.length} form</span> : null}
          {post.visual_choice ? <span className={chip}>{VISUAL[post.visual_choice]}</span> : null}
          {post.carried_over_count > 0 ? (
            <span className="rounded-full bg-[#e4eafb] px-2.5 py-1 text-[13px] font-semibold text-[#23449f]">
              Carried over
            </span>
          ) : null}
        </div>
        <h3 className="text-[17px] font-semibold leading-snug">{post.title}</h3>
        <OutcomeButtons postId={post.id} status={post.status} scheduledFor={post.scheduled_for} back={back} today={today} />
      </div>
      <Link href={`/posts/${post.id}`} className={`${btnSecondary} self-start`}>Open</Link>
    </article>
  );

  return (
    <div className="flex max-w-[960px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={h1}>{isThisWeek ? "This week" : "Week"}</h1>
          <p className="mt-1 text-muted">
            {formatDate(start)} to {formatDate(days[6])} · {counts.join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/week?week=${addDays(start, -7)}`} className={btnSecondary}>Previous</Link>
          {!isThisWeek ? <Link href="/week" className={btnSecondary}>This week</Link> : null}
          <Link href={`/week?week=${addDays(start, 7)}`} className={btnSecondary}>Next</Link>
          <Link href="/inbox" className={btnPrimary}>Add an idea</Link>
        </div>
      </header>

      <section aria-label="Plan this week" className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <p className="flex-[1_1_320px] text-sm text-muted">
          Fill the free posting days (Tuesday, Wednesday, Thursday) with drafts from your saved ideas,
          oldest first. Days that already have a post are left alone. If this week&apos;s days have
          passed, next week is planned instead.
        </p>
        <form action={generatePlan}>
          <input type="hidden" name="week" value={start} />
          <SubmitButton className={btnDark} pendingLabel="Writing the week… up to a minute">
            Generate this week&apos;s plan
          </SubmitButton>
        </form>
      </section>

      {planMessage ? <Notice kind={planMessage.kind}>{planMessage.text}</Notice> : null}

      {error === "date" ? <Notice kind="warn">Please choose a valid date.</Notice> : null}

      {posts.length === 0 ? (
        <p className={`${card} text-muted`}>
          Nothing planned for this week yet. Add an idea in the Idea Inbox and press Create draft.
        </p>
      ) : null}

      {days.map((day) => {
        const dayPosts = posts
          .filter((p) => p.scheduled_for === day)
          .sort((a, b) => ORDER.indexOf(a.platform) - ORDER.indexOf(b.platform));
        if (!dayPosts.length) return null;
        return (
          <section key={day} aria-label={formatDay(day)} className="flex flex-col gap-3">
            <h2 className={h2}>
              {formatDay(day)} <span className="font-normal text-muted">{formatDate(day)}{day === today ? " · today" : ""}</span>
            </h2>
            {dayPosts.map((post) => <Card key={post.id} post={post} />)}
          </section>
        );
      })}

      {(undated ?? []).length ? (
        <section aria-label="No date yet" className="flex flex-col gap-3">
          <h2 className={h2}>No date yet</h2>
          {((undated ?? []) as Row[]).map((post) => <Card key={post.id} post={post} />)}
        </section>
      ) : null}

      <p className="text-sm text-muted">
        Nothing is posted for you. You copy each post to its platform yourself, then mark it here.
      </p>
    </div>
  );
}
