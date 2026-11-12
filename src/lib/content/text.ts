/** Turns a textarea (one item per line) into a clean list. */
export function parseLines(text: string, max = 100): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const key = line.toLowerCase();
    if (!line || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= max) break;
  }
  return out;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** "#Tag" form, no spaces, no duplicates. */
export function normaliseHashtags(tags: readonly string[], max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const cleaned = raw.replace(/[^\p{L}\p{N}_]/gu, "");
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(`#${cleaned}`);
    if (out.length >= max) break;
  }
  return out;
}

/** Banned phrases that appear in the text (case ignored). */
export function findBannedPhrases(text: string, banned: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return banned.filter((phrase) => phrase.trim() && lower.includes(phrase.trim().toLowerCase()));
}

/** Builds the stored text of a learning note from its form fields. */
export function buildLearningNote(fields: ReadonlyArray<{ label: string; value: string }>): string {
  return fields
    .filter((f) => f.value.trim())
    .map((f) => `${f.label}:\n${f.value.trim()}`)
    .join("\n\n");
}

/** "@name" form: one leading @, no spaces. Empty stays empty. */
export function normaliseHandle(raw: string): string {
  const cleaned = raw.trim().replace(/^@+/, "").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 40);
  return cleaned ? `@${cleaned}` : "";
}

/** Same day and same first two words count as the same occasion ("Christmas Day (Nigeria)" = "Christmas Day"). */
export function eventKey(date: string, name: string): string {
  const words = name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return `${date}|${words.slice(0, 2).join(" ")}`;
}
