import type { LearningResult } from "@/lib/ai/schemas";

const normalise = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Keeps only suggestions worth showing: backed by her own note or by at least two pieces
 * of evidence, not already in use or rejected, not repeated, at most five.
 */
export function acceptableRules(
  rules: LearningResult["rules"],
  existing: readonly string[],
): { note: string; type: string; evidence: number; reason: string }[] {
  const seen = new Set(existing.map(normalise));
  const out: { note: string; type: string; evidence: number; reason: string }[] = [];
  for (const r of rules) {
    const note = r.rule.trim().replace(/\s+/g, " ").slice(0, 160);
    const key = normalise(note);
    const evidence = Math.max(1, Math.round(r.evidence_count));
    if (!key || seen.has(key)) continue;
    if (r.type !== "direct_instruction" && evidence < 2) continue;
    seen.add(key);
    out.push({ note, type: r.type, evidence, reason: r.reason.trim().slice(0, 300) });
    if (out.length >= 5) break;
  }
  return out;
}

/** The first part of a post, enough to show its style without sending the whole thing. */
export function excerpt(body: string, max = 280): string {
  const text = body.trim();
  return text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
