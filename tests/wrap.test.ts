import { describe, expect, it } from "vitest";
import { carouselSlides } from "@/lib/content/drafts";
import { fitText, wrapText } from "@/lib/content/wrap";

// A simple stand-in for a canvas: every character is half the font size wide.
const measure = (text: string, size: number) => text.length * size * 0.5;

describe("text fitting for graphics", () => {
  it("wraps at word boundaries within the width", () => {
    const lines = wrapText("one two three four five six", 20, 100, measure);
    expect(lines.every((l) => measure(l, 20) <= 100)).toBe(true);
    expect(lines.join(" ")).toBe("one two three four five six");
  });
  it("keeps deliberate line breaks", () => {
    expect(wrapText("first\n\nsecond", 20, 1000, measure)).toEqual(["first", "", "second"]);
  });
  it("shrinks the text until it fits the box, so nothing overflows", () => {
    const box = { width: 400, height: 300 };
    const result = fitText("A dashboard nobody opens is not a reporting problem at all", box,
      { max: 96, min: 40, lineHeight: 1.2 }, measure);
    expect(result.fits).toBe(true);
    expect(result.fontSize).toBeLessThan(96);
    expect(result.lines.length * result.fontSize * 1.2).toBeLessThanOrEqual(box.height);
    expect(Math.max(...result.lines.map((l) => measure(l, result.fontSize)))).toBeLessThanOrEqual(box.width);
  });
  it("uses the biggest size when the text is short", () => {
    expect(fitText("Hi", { width: 800, height: 600 }, { max: 96, min: 40, lineHeight: 1.2 }, measure).fontSize).toBe(96);
  });
  it("says so when even the smallest size cannot fit", () => {
    const long = "word ".repeat(400);
    expect(fitText(long, { width: 200, height: 100 }, { max: 60, min: 40, lineHeight: 1.2 }, measure).fits).toBe(false);
  });
});

describe("carousel slides", () => {
  it("builds cover, content and closing slides and drops empty ones", () => {
    const slides = carouselSlides({
      cover: " Three questions before you automate ",
      slides: [
        { headline: "Is it stable?", body: "A process that changes weekly is not ready." },
        { headline: " ", body: "ignored" },
      ],
      closing: "Which one do you skip?",
    });
    expect(slides.map((s) => s.kind)).toEqual(["cover", "content", "closing"]);
    expect(slides[0].headline).toBe("Three questions before you automate");
  });
  it("never keeps more than six content slides", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ headline: `Point ${i}`, body: "x" }));
    expect(carouselSlides({ cover: "c", slides: many, closing: "e" })).toHaveLength(8);
  });
});
