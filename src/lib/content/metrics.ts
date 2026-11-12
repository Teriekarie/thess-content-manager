/** Helpers for manually entered analytics. An empty box means "not available", never zero. */

export const METRIC_PLATFORMS = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
} as const;
export type MetricPlatform = keyof typeof METRIC_PLATFORMS;

export const PAGE_FIELDS = [
  { name: "followers", label: "Followers" },
  { name: "impressions", label: "Impressions" },
  { name: "reactions", label: "Likes or reactions" },
  { name: "comments", label: "Comments" },
  { name: "shares", label: "Shares" },
  { name: "profile_visits", label: "Profile visits" },
] as const;
export type PageField = (typeof PAGE_FIELDS)[number]["name"];

export const POST_FIELDS = [
  { name: "impressions", label: "Impressions" },
  { name: "reactions", label: "Reactions" },
  { name: "comments", label: "Comments" },
  { name: "shares", label: "Shares" },
  { name: "saves", label: "Saves" },
] as const;

/** A whole number of zero or more, null for an empty box, or "invalid". */
export function parseMetric(raw: string): number | null | "invalid" {
  const text = raw.trim().replace(/,/g, "");
  if (text === "") return null;
  if (!/^\d{1,10}$/.test(text)) return "invalid";
  return Number(text);
}

/**
 * Engagement rate = (reactions + comments + shares) ÷ impressions, as a percentage.
 * Null when impressions are missing or zero, because the rate cannot be worked out.
 */
export function engagementRate(m: {
  impressions: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
}): number | null {
  if (!m.impressions) return null;
  const actions = (m.reactions ?? 0) + (m.comments ?? 0) + (m.shares ?? 0);
  return Math.round((actions / m.impressions) * 1000) / 10;
}

export type PageRow = { platform: string; week_start: string } & Record<PageField, number | null>;

/**
 * Rolls weekly rows up into months, per platform. Followers is the latest figure in
 * the month (it is a running total); the others are added up. A column stays null
 * when no week in the month had a value for it.
 */
export function monthlyRollup(rows: readonly PageRow[]): (PageRow & { month: string; weeks: number })[] {
  const groups = new Map<string, PageRow[]>();
  for (const row of rows) {
    const key = `${row.week_start.slice(0, 7)}|${row.platform}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const sum = (items: PageRow[], field: PageField) => {
    const values = items.map((i) => i[field]).filter((v): v is number => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  return [...groups.entries()]
    .map(([key, items]) => {
      const [month, platform] = key.split("|");
      const sorted = [...items].sort((a, b) => a.week_start.localeCompare(b.week_start));
      const latestFollowers = [...sorted].reverse().find((i) => i.followers !== null)?.followers ?? null;
      return {
        month,
        platform,
        week_start: sorted[0].week_start,
        weeks: sorted.length,
        followers: latestFollowers,
        impressions: sum(sorted, "impressions"),
        reactions: sum(sorted, "reactions"),
        comments: sum(sorted, "comments"),
        shares: sum(sorted, "shares"),
        profile_visits: sum(sorted, "profile_visits"),
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month) || a.platform.localeCompare(b.platform));
}

export function showMetric(value: number | null): string {
  return value === null ? "Not available" : value.toLocaleString("en-GB");
}
