import Link from "next/link";
import { btnPrimary, card, h1, h2 } from "@/components/ui";
import { requireOwner } from "@/lib/auth/session";
import { summarise, type StatFeedback, type StatPost } from "@/lib/content/stats";
import { getBrandSettings, monthSpend } from "@/lib/data";
import { lagosToday, weekDates, weekStart } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const owner = await requireOwner();
  const supabase = await createClient();
  const [{ data: posts }, { data: feedback }, { count: newIdeas }, spend, settings] = await Promise.all([
    supabase
      .from("posts")
      .select("id, platform, status, scheduled_for, carried_over_count")
      .eq("profile_id", owner.id),
    supabase.from("feedback").select("post_id, rating, created_at").eq("profile_id", owner.id),
    supabase
      .from("ideas")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", owner.id)
      .eq("status", "new"),
    monthSpend(supabase, owner.id),
    getBrandSettings(supabase, owner.id),
  ]);
  const all = (posts ?? []) as StatPost[];
  const totals = summarise(all, (feedback ?? []) as StatFeedback[]);

  const today = lagosToday();
  const days = weekDates(weekStart(today));
  const thisWeek = all.filter(
    (p) => p.scheduled_for && p.scheduled_for >= days[0] && p.scheduled_for <= days[6] && p.status !== "discarded",
  );
  const weekPosted = thisWeek.filter((p) => p.status === "posted").length;
  const laterCount = all.filter((p) => p.status === "planned" && p.scheduled_for && p.scheduled_for > days[6]).length;

  const tiles = [
    ["Generated", totals.generated],
    ["Posted", totals.posted],
    ["You liked", totals.liked],
    ["You did not like", totals.notLiked],
    ["Carried over", totals.carriedOver],
    ["Discarded", totals.discarded],
  ] as const;

  return (
    <div className="flex max-w-[960px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={h1}>Home</h1>
          <p className="mt-1 text-muted">All your posts so far</p>
        </div>
        <Link href="/inbox" className={btnPrimary}>Add an idea</Link>
      </header>

      {totals.generated === 0 ? (
        <section className={`${card} flex flex-col gap-3`}>
          <h2 className={h2}>Getting started</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted">
            <li>In Settings, check your details and paste some of your own writing to set your voice.</li>
            <li>In the Idea Inbox, save a thought or learning note and press Create draft.</li>
            <li>Review the draft, copy it to its platform, then mark it Posted.</li>
          </ol>
        </section>
      ) : null}

      <section aria-label="Totals" className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
        {tiles.map(([name, value]) => (
          <div key={name} className="rounded-xl border border-line bg-surface p-5">
            <div className="text-sm text-muted">{name}</div>
            <div className="font-display text-[32px] font-bold">{value}</div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="By platform" className={`${card} flex min-w-0 flex-[3_1_380px] flex-col gap-3`}>
          <h2 className={h2}>By platform</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-2 pr-2 font-semibold">Platform</th>
                  <th className="p-2 text-right font-semibold">Generated</th>
                  <th className="p-2 text-right font-semibold">Posted</th>
                  <th className="py-2 pl-2 text-right font-semibold">Waiting</th>
                </tr>
              </thead>
              <tbody>
                {totals.byPlatform.map((row) => (
                  <tr key={row.platform} className="border-t border-line">
                    <td className="py-3 pr-2 font-semibold">{row.name}</td>
                    <td className="px-2 py-3 text-right">{row.generated}</td>
                    <td className="px-2 py-3 text-right">{row.posted}</td>
                    <td className="py-3 pl-2 text-right">{row.waiting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex min-w-0 flex-[2_1_280px] flex-col gap-4">
          <section aria-label="This week" className={`${card} flex flex-col gap-2 !p-5`}>
            <h2 className={h2}>This week</h2>
            <p className="text-sm text-[#3a404b]">
              {thisWeek.length} planned. {weekPosted} posted, {thisWeek.length - weekPosted} waiting for you.
              {laterCount ? ` ${laterCount} more scheduled for later.` : ""}
            </p>
            <Link href="/week" className="flex min-h-11 items-center font-semibold underline">Open this week&apos;s board</Link>
          </section>
          <section aria-label="Ideas" className={`${card} flex flex-col gap-2 !p-5`}>
            <h2 className={h2}>Ideas</h2>
            <p className="text-sm text-[#3a404b]">
              {newIdeas ?? 0} idea{newIdeas === 1 ? "" : "s"} waiting to be drafted.
            </p>
            <Link href="/inbox" className="flex min-h-11 items-center font-semibold underline">Open the Idea Inbox</Link>
          </section>
          <section aria-label="AI spend" className={`${card} flex flex-col gap-2 !p-5`}>
            <h2 className={h2}>AI spend this month</h2>
            <p className="text-sm text-[#3a404b]">
              About ${spend.toFixed(2)}
              {settings.monthlyBudget ? ` of your $${settings.monthlyBudget} budget` : ""}. This is an estimate
              and does not include the small per-search fee for web checks.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
