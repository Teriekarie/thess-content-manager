import Link from "next/link";
import { Notice } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { btnDark, btnPrimary, btnSecondary, card, field, h1, h2, label } from "@/components/ui";
import { requireOwner } from "@/lib/auth/session";
import { PLATFORMS, type Platform } from "@/lib/content/defaults";
import {
  METRIC_PLATFORMS,
  PAGE_FIELDS,
  POST_FIELDS,
  engagementRate,
  monthlyRollup,
  showMetric,
  type MetricPlatform,
  type PageRow,
} from "@/lib/content/metrics";
import { asStringArray } from "@/lib/content/text";
import { addDays, formatDate, formatMonth, isValidMonth, lagosToday, weekStart } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { savePageMetrics, savePostMetrics } from "./actions";

const ERRORS: Record<string, string> = {
  week: "Please choose a week that has already started.",
  number: "Numbers must be whole numbers, for example 1250. Leave a box empty if you do not have it.",
  empty: "Enter at least one number before saving.",
  save: "That could not be saved. Please try again.",
};

type PostRow = {
  id: string;
  platform: Platform;
  title: string;
  format: string;
  hashtags: unknown;
  posted_at: string | null;
  scheduled_for: string | null;
};
type PostMetric = {
  post_id: string;
  impressions: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; view?: string; month?: string; platform?: string; q?: string }>;
}) {
  const owner = await requireOwner();
  const params = await searchParams;
  const view = params.view === "monthly" ? "monthly" : "weekly";
  const month = params.month && isValidMonth(params.month) ? params.month : "";
  const platformFilter = params.platform && params.platform in METRIC_PLATFORMS ? params.platform : "";
  const q = (params.q ?? "").trim().toLowerCase().slice(0, 80);
  const today = lagosToday();
  const thisWeek = weekStart(today);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(thisWeek, -7 * i));

  const supabase = await createClient();
  const [{ data: pageData }, { data: postData }, { data: metricData }] = await Promise.all([
    supabase
      .from("platform_metrics")
      .select("platform, week_start, followers, impressions, reactions, comments, shares, profile_visits")
      .eq("profile_id", owner.id)
      .order("week_start", { ascending: false })
      .limit(400),
    supabase
      .from("posts")
      .select("id, platform, title, format, hashtags, posted_at, scheduled_for")
      .eq("profile_id", owner.id)
      .eq("status", "posted")
      .order("posted_at", { ascending: false })
      .limit(200),
    supabase
      .from("post_metrics")
      .select("post_id, impressions, reactions, comments, shares, saves")
      .eq("profile_id", owner.id),
  ]);

  const allPages = (pageData ?? []) as PageRow[];
  const months = [...new Set(allPages.map((r) => r.week_start.slice(0, 7)))];
  const pages = allPages
    .filter((r) => !month || r.week_start.startsWith(month))
    .filter((r) => !platformFilter || r.platform === platformFilter);
  const tableRows: { period: string; row: PageRow }[] =
    view === "monthly"
      ? monthlyRollup(pages).map((row) => ({
          period: `${formatMonth(row.month)} (${row.weeks} week${row.weeks === 1 ? "" : "s"})`,
          row,
        }))
      : pages.map((row) => ({
          period: `${formatDate(row.week_start)} to ${formatDate(addDays(row.week_start, 6))}`,
          row,
        }));

  const metrics = new Map(((metricData ?? []) as PostMetric[]).map((m) => [m.post_id, m]));
  const posts = ((postData ?? []) as PostRow[]).filter((p) => {
    if (!q) return true;
    const tags = asStringArray(p.hashtags).join(" ").toLowerCase();
    return p.title.toLowerCase().includes(q) || tags.includes(q.replace(/^#/, ""));
  });

  const link = (changes: Record<string, string>) => {
    const next = new URLSearchParams({ view, month, platform: platformFilter, q, ...changes });
    for (const [key, value] of [...next]) if (!value) next.delete(key);
    return `/analytics?${next}`;
  };
  const cell = "px-2 py-3 text-right";

  return (
    <div className="flex max-w-[1240px] flex-col gap-6">
      <header>
        <h1 className={h1}>Analytics</h1>
        <p className="mt-1 text-muted">
          Once a week, copy the numbers from each of your pages. They are saved so you can look back
          by week or month, and see how each post and its hashtags did.
        </p>
      </header>

      {params.saved ? <Notice kind="ok">Numbers saved.</Notice> : null}
      {params.error && ERRORS[params.error] ? <Notice kind="warn">{ERRORS[params.error]}</Notice> : null}

      <form action={savePageMetrics} className={`${card} flex flex-col gap-4`}>
        <h2 className={h2}>Page numbers for the week</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="week" className={label}>Week</label>
            <select id="week" name="week" className={`${field} min-h-11`}>
              {weeks.map((w) => (
                <option key={w} value={w}>{formatDate(w)} to {formatDate(addDays(w, 6))}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="platform" className={label}>Platform</label>
            <select id="platform" name="platform" className={`${field} min-h-11`}>
              {Object.entries(METRIC_PLATFORMS).map(([value, name]) => (
                <option key={value} value={value}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          {PAGE_FIELDS.map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <label htmlFor={`page-${f.name}`} className={label}>{f.label}</label>
              <input id={`page-${f.name}`} name={f.name} inputMode="numeric" className={`${field} min-h-11`} />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex-[1_1_280px] text-sm text-muted">
            Leave a box empty if the platform does not show that number. Empty is saved as &ldquo;not
            available&rdquo;, never as zero. Saving the same week and platform again replaces the old numbers.
          </p>
          <SubmitButton className={btnPrimary} pendingLabel="Saving…">Save numbers</SubmitButton>
        </div>
      </form>

      <section aria-label="Saved page performance" className={`${card} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={h2}>Saved page performance</h2>
          <div className="flex flex-wrap items-end gap-2">
            <Link href={link({ view: "weekly" })} aria-current={view === "weekly" ? "true" : undefined}
              className={view === "weekly" ? btnDark : btnSecondary}>Weekly</Link>
            <Link href={link({ view: "monthly" })} aria-current={view === "monthly" ? "true" : undefined}
              className={view === "monthly" ? btnDark : btnSecondary}>Monthly</Link>
            <form action="/analytics" className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="view" value={view} />
              {q ? <input type="hidden" name="q" value={q} /> : null}
              <label className="flex flex-col gap-1 text-[13px] font-semibold">
                Month
                <select name="month" defaultValue={month} className={`${field} min-h-11 py-0`}>
                  <option value="">All months</option>
                  {months.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-semibold">
                Platform
                <select name="platform" defaultValue={platformFilter} className={`${field} min-h-11 py-0`}>
                  <option value="">All platforms</option>
                  {Object.entries(METRIC_PLATFORMS).map(([value, name]) => (
                    <option key={value} value={value}>{name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className={btnSecondary}>Show</button>
            </form>
          </div>
        </div>
        {pages.length === 0 ? (
          <p className="text-muted">No page numbers saved yet for this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-2 pr-2 font-semibold">{view === "monthly" ? "Month" : "Week"}</th>
                  <th className="p-2 font-semibold">Platform</th>
                  {PAGE_FIELDS.map((f) => (
                    <th key={f.name} className="p-2 text-right font-semibold">{f.label}</th>
                  ))}
                  <th className="py-2 pl-2 text-right font-semibold">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ period, row }) => {
                  const rate = engagementRate(row);
                  return (
                    <tr key={`${period}-${row.platform}`} className="border-t border-line">
                      <td className="py-3 pr-2">{period}</td>
                      <td className="px-2 py-3 font-semibold">
                        {METRIC_PLATFORMS[row.platform as MetricPlatform] ?? row.platform}
                      </td>
                      {PAGE_FIELDS.map((f) => (
                        <td key={f.name} className={`${cell} ${row[f.name] === null ? "text-muted" : ""}`}>
                          {showMetric(row[f.name])}
                        </td>
                      ))}
                      <td className={`py-3 pl-2 text-right ${rate === null ? "text-muted" : ""}`}>
                        {rate === null ? "Not available" : `${rate}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-sm text-muted">
          Engagement = (reactions + comments + shares) ÷ impressions. In the monthly view, followers is
          the latest figure in the month and the other columns are added up. All numbers here were
          entered by you.
        </p>
      </section>

      <section id="posts" aria-label="Post performance" className={`${card} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex-[1_1_280px]">
            <h2 className={h2}>Post performance</h2>
            <p className="mt-1 text-sm text-muted">
              Every post you marked as Posted appears here with its hashtags. Add its numbers when you have them.
            </p>
          </div>
          <form action="/analytics#posts" className="flex items-end gap-2">
            <input type="hidden" name="view" value={view} />
            <label className="flex flex-col gap-1 text-[13px] font-semibold">
              Search posts or hashtags
              <input type="search" name="q" defaultValue={q} placeholder="For example: #PowerBI"
                className={`${field} min-h-11 py-0`} />
            </label>
            <button type="submit" className={btnSecondary}>Search</button>
          </form>
        </div>
        {posts.length === 0 ? (
          <p className="text-muted">
            {q ? "No posted pieces match that search." : "Nothing marked as Posted yet. Mark a post as Posted and it will appear here."}
          </p>
        ) : null}
        {posts.map((post) => {
          const m = metrics.get(post.id);
          const rate = m ? engagementRate(m) : null;
          const tags = asStringArray(post.hashtags);
          const when = (post.posted_at ?? post.scheduled_for ?? "").slice(0, 10);
          return (
            <form key={post.id} action={savePostMetrics} className="flex flex-col gap-3 rounded-lg border border-line p-4">
              <input type="hidden" name="id" value={post.id} />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/posts/${post.id}`} className="font-semibold underline">{post.title}</Link>
                <span className="text-sm text-muted">
                  {PLATFORMS[post.platform]}{when ? ` · posted ${formatDate(when)}` : ""}{post.format ? ` · ${post.format}` : ""}
                </span>
              </div>
              <p className="text-sm text-[#3a404b]">{tags.length ? tags.join(" ") : "No hashtags"}</p>
              <div className="flex flex-wrap items-end gap-3">
                {POST_FIELDS.map((f) => (
                  <label key={f.name} className="flex w-[110px] flex-col gap-1 text-[13px] font-semibold">
                    {f.label}
                    <input name={f.name} inputMode="numeric" defaultValue={m?.[f.name] ?? ""}
                      className={`${field} min-h-11 py-0`} />
                  </label>
                ))}
                <button type="submit" className={m ? btnSecondary : btnPrimary}>{m ? "Update" : "Save"}</button>
                <span className="pb-2.5 text-sm text-muted">
                  {rate === null ? "Engagement: not available" : `Engagement: ${rate}%`}
                </span>
              </div>
            </form>
          );
        })}
      </section>
    </div>
  );
}
