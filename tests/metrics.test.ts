import { describe, expect, it } from "vitest";
import { engagementRate, monthlyRollup, parseMetric, showMetric } from "@/lib/content/metrics";

describe("metric entry", () => {
  it("keeps an empty box as not available, never zero", () => {
    expect(parseMetric("")).toBeNull();
    expect(parseMetric("  ")).toBeNull();
    expect(parseMetric("0")).toBe(0);
    expect(showMetric(null)).toBe("Not available");
  });
  it("accepts whole numbers with or without commas", () => {
    expect(parseMetric("1,250")).toBe(1250);
    expect(parseMetric(" 87 ")).toBe(87);
  });
  it("rejects anything that is not a whole number", () => {
    for (const bad of ["-5", "12.5", "abc", "1e3"]) expect(parseMetric(bad)).toBe("invalid");
  });
});

describe("engagement rate", () => {
  it("is actions divided by impressions, as a percentage", () => {
    expect(engagementRate({ impressions: 1000, reactions: 40, comments: 8, shares: 2 })).toBe(5);
  });
  it("treats missing actions as none but needs impressions", () => {
    expect(engagementRate({ impressions: 200, reactions: 10, comments: null, shares: null })).toBe(5);
    expect(engagementRate({ impressions: null, reactions: 10, comments: 1, shares: 1 })).toBeNull();
    expect(engagementRate({ impressions: 0, reactions: 10, comments: 1, shares: 1 })).toBeNull();
  });
});

describe("monthly roll-up", () => {
  // Fictional sample data only.
  const row = (week_start: string, platform: string, followers: number | null, impressions: number | null) => ({
    week_start, platform, followers, impressions, reactions: null, comments: null, shares: null, profile_visits: null,
  });
  const months = monthlyRollup([
    row("2026-11-02", "linkedin", 1200, 3000),
    row("2026-11-09", "linkedin", 1240, 2500),
    row("2026-11-09", "instagram", null, 900),
    row("2026-10-26", "linkedin", 1190, null),
  ]);
  it("adds up the month and uses the latest follower figure", () => {
    const nov = months.find((m) => m.month === "2026-11" && m.platform === "linkedin");
    expect(nov).toMatchObject({ followers: 1240, impressions: 5500, weeks: 2 });
  });
  it("keeps platforms and months apart, newest month first", () => {
    expect(months.map((m) => `${m.month} ${m.platform}`)).toEqual([
      "2026-11 instagram", "2026-11 linkedin", "2026-10 linkedin",
    ]);
  });
  it("leaves a column not available when no week had a value", () => {
    expect(months.find((m) => m.month === "2026-10")?.impressions).toBeNull();
    expect(months.find((m) => m.platform === "instagram")?.followers).toBeNull();
  });
});
