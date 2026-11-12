import { describe, expect, it } from "vitest";
import { summarise } from "@/lib/content/stats";

// Fictional sample data only.
const posts = [
  { id: "a", platform: "linkedin" as const, status: "posted", scheduled_for: "2026-11-10", carried_over_count: 0 },
  { id: "b", platform: "linkedin" as const, status: "planned", scheduled_for: "2026-11-12", carried_over_count: 1 },
  { id: "c", platform: "instagram_facebook" as const, status: "discarded", scheduled_for: null, carried_over_count: 0 },
  { id: "d", platform: "tiktok" as const, status: "planned", scheduled_for: null, carried_over_count: 0 },
];
const feedback = [
  { post_id: "a", rating: "down", created_at: "2026-11-10T08:00:00Z" },
  { post_id: "a", rating: "up", created_at: "2026-11-10T09:00:00Z" },
  { post_id: "b", rating: "down", created_at: "2026-11-11T09:00:00Z" },
  { post_id: "gone", rating: "up", created_at: "2026-11-11T09:00:00Z" },
];

describe("dashboard totals", () => {
  const totals = summarise(posts, feedback);
  it("counts posts by outcome", () => {
    expect(totals).toMatchObject({ generated: 4, posted: 1, waiting: 2, carriedOver: 1, discarded: 1 });
  });
  it("uses each post's latest rating and ignores ratings for missing posts", () => {
    expect(totals.liked).toBe(1);
    expect(totals.notLiked).toBe(1);
  });
  it("splits by platform", () => {
    expect(totals.byPlatform.find((p) => p.platform === "linkedin")).toMatchObject({
      generated: 2, posted: 1, waiting: 1,
    });
    expect(totals.byPlatform).toHaveLength(3);
  });
  it("is all zeros when there are no posts", () => {
    expect(summarise([], [])).toMatchObject({ generated: 0, posted: 0, liked: 0 });
  });
});
