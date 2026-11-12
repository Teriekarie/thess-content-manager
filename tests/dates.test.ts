import { describe, expect, it } from "vitest";
import {
  addDays,
  isValidDate,
  lagosToday,
  nextPostingDate,
  sameDayNextWeek,
  weekDates,
  weekStart,
  weekday,
} from "@/lib/dates";

describe("dates", () => {
  it("uses the Lagos date, which is one hour ahead of UTC", () => {
    expect(lagosToday(new Date("2026-11-11T22:30:00Z"))).toBe("2026-11-11");
    expect(lagosToday(new Date("2026-11-11T23:30:00Z"))).toBe("2026-11-12");
  });
  it("finds the Monday of a week", () => {
    expect(weekStart("2026-11-11")).toBe("2026-11-09"); // Wednesday
    expect(weekStart("2026-11-09")).toBe("2026-11-09"); // Monday
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday
  });
  it("lists the seven days of a week", () => {
    const days = weekDates("2026-11-09");
    expect(days).toHaveLength(7);
    expect(days[6]).toBe("2026-11-15");
  });
  it("adds days across month and year ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(sameDayNextWeek("2026-11-12")).toBe("2026-11-19");
    expect(weekday("2026-11-12")).toBe(4);
  });
  it("rejects dates that do not exist", () => {
    expect(isValidDate("2026-11-12")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("12/11/2026")).toBe(false);
    expect(isValidDate("")).toBe(false);
  });
});

describe("nextPostingDate", () => {
  it("picks today when today is a free posting day", () => {
    expect(nextPostingDate("2026-11-11", [])).toBe("2026-11-11"); // Wednesday
  });
  it("skips days that already have a post", () => {
    expect(nextPostingDate("2026-11-11", ["2026-11-11"])).toBe("2026-11-12");
    expect(nextPostingDate("2026-11-11", ["2026-11-11", "2026-11-12"])).toBe("2026-11-17");
  });
  it("skips non-posting days", () => {
    expect(nextPostingDate("2026-11-13", [])).toBe("2026-11-17"); // Friday -> Tuesday
  });
});

import { addMonths, isValidMonth, monthGrid } from "@/lib/dates";

describe("month calendar", () => {
  it("lays November 2026 out from Monday, with Sunday the 1st in the first row", () => {
    const cells = monthGrid("2026-11");
    expect(cells).toHaveLength(42);
    expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(cells[7]).toBe("2026-11-02");
    expect(cells.filter(Boolean)).toHaveLength(30);
  });
  it("handles a month that starts on Monday and February", () => {
    expect(monthGrid("2027-02")[0]).toBe("2027-02-01");
    expect(monthGrid("2027-02").filter(Boolean)).toHaveLength(28);
  });
  it("moves between months across a year end", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
    expect(isValidMonth("2026-13")).toBe(false);
  });
});
