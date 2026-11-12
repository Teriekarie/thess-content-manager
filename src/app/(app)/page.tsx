import Link from "next/link";
import { card, h2 } from "@/components/ui";
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
    ["Generated", totals.generated, "bg-accent"],
    ["Posted", totals.posted, "bg-ok"],
    ["You liked", totals.liked, "bg-gold"],
    ["You did not like", totals.notLiked, "bg-[#c2410c]"],
    ["Carried over", totals.carriedOver, "bg-[#0a66c2]"],
    ["Discarded", totals.discarded, "bg-[#8a7f92]"],
  ] as const;

  return (
    <div className="flex max-w-[960px] flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-plum px-7 py-8 text-white">
        <div className="flex-[1_1_320px]">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">Your content desk</p>
          <h1 className="mt-2 font-display text-[34px] font-bold leading-tight tracking-tight">
            {thisWeek.length - weekPosted > 0
              ? `${thisWeek.length - weekPosted} post${thisWeek.length - weekPosted === 1 ? "" : "s"} waiting for you this week`
              : "You are all caught up this week"}
          </h1>
          <p className="mt-2 text-[#d9cbe6]">
            {newIdeas ?? 0} idea{newIdeas === 1 ? "" : "s"} in your inbox · {totals.posted} posted so far
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/inbox" className="inline-flex min-h-11 items-center rounded-xl bg-gold px-5 font-semibold text-plum hover:bg-[#f8c95f]">
            Add an idea
          </Link>
          <Link href="/week" className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-5 font-semibold text-white hover:bg-white/10">
            This week
          </Link>
        </div>
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
        {tiles.map(([name, value, colour]) => (
          <div key={name} className={`${card} !p-5`}>
            <span aria-hidden="true" className={`block h-1.5 w-8 rounded-full ${colour}`} />
            <div className="mt-3 text-sm text-muted">{name}</div>
            <div className="font-display text-[34px] font-bold leading-tight">{value}</div>
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
