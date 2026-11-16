import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isAuthorisedCron } from "@/lib/auth/cron";
import { freePostingDays, orderIdeas } from "@/lib/planning";

describe("free posting days", () => {
  const week = "2026-11-16"; // a Monday
  it("offers Tuesday, Wednesday and Thursday of an empty week", () => {
    expect(freePostingDays(week, "2026-11-16", [])).toEqual(["2026-11-17", "2026-11-18", "2026-11-19"]);
  });
  it("leaves out days that already have a post, so a second run makes no duplicates", () => {
    expect(freePostingDays(week, "2026-11-16", ["2026-11-17", "2026-11-19"])).toEqual(["2026-11-18"]);
    expect(freePostingDays(week, "2026-11-16", ["2026-11-17", "2026-11-18", "2026-11-19"])).toEqual([]);
  });
  it("leaves out days that have passed", () => {
    expect(freePostingDays(week, "2026-11-18", [])).toEqual(["2026-11-18", "2026-11-19"]);
    expect(freePostingDays(week, "2026-11-22", [])).toEqual([]); // Sunday evening: plan next week
  });
});

describe("idea order for the plan", () => {
  // Fictional sample data only.
  const ideas = [
    { id: "t1", input_type: "trending", created_at: "2026-11-10" },
    { id: "own2", input_type: "thought", created_at: "2026-11-12" },
    { id: "holiday", input_type: "event", created_at: "2026-11-09" },
    { id: "own1", input_type: "learning_note", created_at: "2026-11-11" },
  ];
  it("uses your own ideas first, oldest first, then trending ones, and never holidays", () => {
    expect(orderIdeas(ideas).map((i) => i.id)).toEqual(["own1", "own2", "t1"]);
  });
});

describe("scheduled job secret", () => {
  const secret = "a-long-random-secret-value";
  it("accepts only the exact secret", () => {
    expect(isAuthorisedCron(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorisedCron(`Bearer ${secret}x`, secret)).toBe(false);
    expect(isAuthorisedCron(secret, secret)).toBe(false);
    expect(isAuthorisedCron(null, secret)).toBe(false);
  });
  it("lets nobody in when no secret, or a weak one, is set", () => {
    expect(isAuthorisedCron("Bearer ", "")).toBe(false);
    expect(isAuthorisedCron("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorisedCron("Bearer short", "short")).toBe(false);
  });
});
