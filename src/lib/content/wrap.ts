/**
 * Text fitting for drawn graphics. `measure` returns the width of a string at a font size,
 * so the same logic works on a real canvas and in tests.
 */
export type Measure = (text: string, fontSize: number) => number;

/** Breaks text into lines no wider than maxWidth. Blank lines in the text are kept as breaks. */
export function wrapText(text: string, fontSize: number, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (lines.length && lines[lines.length - 1] !== "") lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate, fontSize) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * The largest font size (stepping down from `max` to `min`) at which the text fits
 * inside the box, so text never spills over the edge of a slide.
 */
export function fitText(
  text: string,
  box: { width: number; height: number },
  sizes: { max: number; min: number; lineHeight: number },
  measure: Measure,
): { fontSize: number; lines: string[]; fits: boolean } {
  for (let fontSize = sizes.max; fontSize >= sizes.min; fontSize -= 2) {
    const lines = wrapText(text, fontSize, box.width, measure);
    const widest = Math.max(0, ...lines.map((l) => measure(l, fontSize)));
    if (lines.length * fontSize * sizes.lineHeight <= box.height && widest <= box.width) {
      return { fontSize, lines, fits: true };
    }
  }
  return { fontSize: sizes.min, lines: wrapText(text, sizes.min, box.width, measure), fits: false };
}
