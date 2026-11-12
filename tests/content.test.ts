import { describe, expect, it } from "vitest";
import { estimateCost } from "@/lib/ai/pricing";
import { buildLinkedInPrompt, buildSystemPrompt, buildVoiceGuidePrompt } from "@/lib/ai/prompts";
import { LinkedInDraftSchema } from "@/lib/ai/schemas";
import { linkedInRow, matchPillar } from "@/lib/content/drafts";
import {
  buildLearningNote,
  findBannedPhrases,
  normaliseHashtags,
  parseLines,
} from "@/lib/content/text";

const brand = {
  positioning: "AI, Automation & Data Solutions",
  bio: "",
  audience: ["Recruiters"],
  pillars: ["Building in public & experiments", "Relatable technology humour"],
  keywords: ["Workflow automation"],
  bannedPhrases: ["Game-changer", "Delve into"],
  voiceGuide: null,
};

// Fictional sample data only.
const draft = {
  title: "Retries and duplicates",
  hook: "My workflow made the same record three times.",
  body: "My workflow made the same record three times.\n\nHere is what I changed.",
  alt_hooks: ["One", "Two", "Three"],
  cta: null,
  pillar: "building in public",
  objective: "Show practical work",
  tone: "Light",
  length: "short" as const,
  format: "Text post",
  format_reason: "One idea.",
  keywords: ["workflow automation"],
  hashtags: ["#Automation", "automation", "No Code", ""],
  clarifying_question: null,
  safety_status: "clear" as const,
  safety_reasons: [],
  review_notes: "",
  needs_user_confirmation: false,
};

describe("text helpers", () => {
  it("turns lines into a clean list without blanks or repeats", () => {
    expect(parseLines(" a \n\nB\na\n")).toEqual(["a", "B"]);
  });
  it("tidies hashtags", () => {
    expect(normaliseHashtags(["#Automation", "automation", "No Code", ""])).toEqual([
      "#Automation",
      "#NoCode",
    ]);
  });
  it("spots banned phrases whatever the capitals", () => {
    expect(findBannedPhrases("This is a GAME-CHANGER.", brand.bannedPhrases)).toEqual(["Game-changer"]);
    expect(findBannedPhrases("A calm sentence.", brand.bannedPhrases)).toEqual([]);
  });
  it("builds a learning note from the filled-in boxes only", () => {
    expect(
      buildLearningNote([
        { label: "Blockers", value: " duplicates " },
        { label: "Open questions", value: "" },
      ]),
    ).toBe("Blockers:\nduplicates");
  });
});

describe("draft handling", () => {
  it("accepts a well-formed AI answer and rejects a malformed one", () => {
    expect(LinkedInDraftSchema.safeParse(draft).success).toBe(true);
    expect(LinkedInDraftSchema.safeParse({ ...draft, body: undefined }).success).toBe(false);
    expect(LinkedInDraftSchema.safeParse({ ...draft, safety_status: "fine" }).success).toBe(false);
  });
  it("matches the pillar to the saved list", () => {
    expect(matchPillar("building in public", brand.pillars)).toBe("Building in public & experiments");
  });
  it("prepares the saved row: two hooks, tidy hashtags, saved pillar", () => {
    const row = linkedInRow(draft, brand);
    expect(row.alt_hooks).toEqual(["One", "Two"]);
    expect(row.hashtags).toEqual(["#Automation", "#NoCode"]);
    expect(row.pillar).toBe("Building in public & experiments");
    expect(row.platform).toBe("linkedin");
    expect(row.structured_content.banned_found).toEqual([]);
  });
  it("flags a banned phrase that slipped into a draft", () => {
    const row = linkedInRow({ ...draft, body: "Let us delve into retries." }, brand);
    expect(row.structured_content.banned_found).toEqual(["Delve into"]);
  });
});

describe("prompts", () => {
  it("tells the writer the banned phrases, pillars and the no-invention rule", () => {
    const system = buildSystemPrompt(brand);
    expect(system).toContain("Game-changer");
    expect(system).toContain("Relatable technology humour");
    expect(system).toMatch(/Never invent anecdotes/);
  });
  it("uses the approved voice guide when there is one", () => {
    expect(buildSystemPrompt({ ...brand, voiceGuide: "Short sentences. Dry humour." })).toContain(
      "Dry humour",
    );
  });
  it("passes the idea and tone to the writer", () => {
    const prompt = buildLinkedInPrompt({
      idea: "Dashboards nobody opens",
      inputType: "thought",
      tone: "funny",
      recentTitles: [],
    });
    expect(prompt).toContain("Dashboards nobody opens");
    expect(prompt).toContain("light and funny");
  });
  it("marks style references as not the author's words", () => {
    expect(buildVoiceGuidePrompt(["mine"], ["theirs"])).toMatch(/Never copy sentences/);
  });
});

describe("cost estimate", () => {
  it("prices known models and admits when it does not know", () => {
    expect(estimateCost("claude-opus-5-5", 1_000_000, 1_000_000)).toBe(24);
    expect(estimateCost("claude-haiku-5-5", 3000, 2000)).toBeCloseTo(0.0013, 6);
    expect(estimateCost("some-other-model", 1000, 1000)).toBeNull();
  });
});
