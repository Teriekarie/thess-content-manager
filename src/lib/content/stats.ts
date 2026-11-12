import { PLATFORMS, type Platform } from "./defaults";

export type StatPost = {
  id: string;
  platform: Platform;
  status: string;
  scheduled_for: string | null;
  carried_over_count: number;
};
export type StatFeedback = { post_id: string; rating: string; created_at: string };

export type Summary = {
  generated: number;
  posted: number;
  waiting: number;
  liked: number;
  notLiked: number;
  carriedOver: number;
  discarded: number;
  byPlatform: { platform: Platform; name: string; generated: number; posted: number; waiting: number }[];
};

/** Dashboard totals. A post's rating is its most recent one. */
export function summarise(posts: readonly StatPost[], feedback: readonly StatFeedback[]): Summary {
  const latest = new Map<string, StatFeedback>();
  for (const f of feedback) {
    const seen = latest.get(f.post_id);
    if (!seen || f.created_at > seen.created_at) latest.set(f.post_id, f);
  }
  const ids = new Set(posts.map((p) => p.id));
  const ratings = [...latest.values()].filter((f) => ids.has(f.post_id));
  const count = (test: (p: StatPost) => boolean) => posts.filter(test).length;

  return {
    generated: posts.length,
    posted: count((p) => p.status === "posted"),
    waiting: count((p) => p.status === "planned"),
    liked: ratings.filter((f) => f.rating === "up").length,
    notLiked: ratings.filter((f) => f.rating === "down").length,
    carriedOver: count((p) => p.carried_over_count > 0),
    discarded: count((p) => p.status === "discarded"),
    byPlatform: (Object.keys(PLATFORMS) as Platform[]).map((platform) => ({
      platform,
      name: PLATFORMS[platform],
      generated: count((p) => p.platform === platform),
      posted: count((p) => p.platform === platform && p.status === "posted"),
      waiting: count((p) => p.platform === platform && p.status === "planned"),
    })),
  };
}
