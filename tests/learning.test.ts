import { describe, expect, it } from "vitest";
import { buildLearningPrompt, buildSystemPrompt } from "@/lib/ai/prompts";
import { acceptableRules, excerpt } from "@/lib/content/learning";

// Fictional sample data only.
const rule = (rule: string, type: "preference" | "edit_pattern" | "direct_instruction", evidence_count: number) => ({
  rule, type, evidence_count, reason: "Seen in feedback.",
});

describe("learned rules", () => {
  it("accepts a rule from her own note, or one seen at least twice", () => {
    const out = acceptableRules(
      [rule("Fewer hashtags, three at most", "direct_instruction", 1), rule("Shorter openings", "edit_pattern", 3)],
      [],
    );
    expect(out.map((r) => r.note)).toEqual(["Fewer hashtags, three at most", "Shorter openings"]);
  });
  it("ignores a pattern seen only once, so one stray rating changes nothing", () => {
    expect(acceptableRules([rule("Use more emojis", "preference", 1)], [])).toEqual([]);
  });
  it("skips rules already in use, rejected or repeated", () => {
    const out = acceptableRules(
      [rule("Keep it short!", "direct_instruction", 1), rule("keep it short", "direct_instruction", 1), rule("Be warmer", "preference", 2)],
      ["Keep it short"],
    );
    expect(out.map((r) => r.note)).toEqual(["Be warmer"]);
  });
  it("never suggests more than five at once", () => {
    const many = Array.from({ length: 9 }, (_, i) => rule(`Rule number ${i}`, "preference", 2));
    expect(acceptableRules(many, [])).toHaveLength(5);
  });
  it("shortens long posts to an opening excerpt", () => {
    expect(excerpt("short")).toBe("short");
    const long = "word ".repeat(200);
    expect(excerpt(long, 50).length).toBeLessThanOrEqual(51);
    expect(excerpt(long, 50).endsWith("…")).toBe(true);
  });
});

describe("learning in prompts", () => {
  const brand = {
    positioning: "", bio: "", audience: [], pillars: [], keywords: [], bannedPhrases: [], voiceGuide: null,
  };
  it("adds approved rules to every draft's instructions", () => {
    const system = buildSystemPrompt({ ...brand, learnedRules: ["Keep the opening to one line"] });
    expect(system).toContain("Keep the opening to one line");
    expect(system).toContain("learned_from_feedback");
  });
  it("leaves the instructions unchanged when no rules are approved", () => {
    expect(buildSystemPrompt(brand)).not.toContain("learned_from_feedback");
  });
  it("passes her note and asks for evidence before suggesting a rule", () => {
    const prompt = buildLearningPrompt({
      feedback: [{ rating: "down", comment: "too formal", title: "T", platform: "linkedin", excerpt: "Opening" }],
      edits: [],
      activeRules: [],
      dismissedRules: ["Use more emojis"],
    });
    expect(prompt).toContain("too formal");
    expect(prompt).toContain("Use more emojis");
    expect(prompt).toMatch(/at least two separate/);
  });
});
