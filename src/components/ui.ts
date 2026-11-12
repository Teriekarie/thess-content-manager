/** Shared class names so buttons, cards and fields look the same everywhere. */
import type { Platform } from "@/lib/content/defaults";

const btn =
  "inline-flex min-h-11 items-center justify-center rounded-xl font-semibold transition-colors disabled:opacity-60";
export const btnPrimary = `${btn} bg-accent px-5 text-white shadow-sm hover:bg-[#5b21b6]`;
export const btnDark = `${btn} bg-plum px-4 text-white hover:bg-plum-soft`;
export const btnSecondary = `${btn} border border-line-strong bg-surface px-4 hover:bg-accent-soft`;
export const btnOk = `${btn} border border-ok bg-surface px-4 text-ok hover:bg-ok-soft`;
export const btnOkSelected = `${btn} border border-ok bg-ok px-4 text-white`;
export const btnDanger = `${btn} border border-line-strong bg-surface px-4 text-[#8a2b1d] hover:bg-[#f6e3e0]`;
export const card =
  "rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(42,20,56,0.04),0_10px_28px_-16px_rgba(42,20,56,0.18)]";
export const field =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-ink";
export const label = "text-sm font-semibold";
export const chip = "rounded-full bg-accent-soft px-2.5 py-1 text-[13px] text-[#4c1d95]";
export const chipDark = "rounded-full bg-plum px-3 py-1 text-[13px] font-semibold text-white";
export const h1 = "font-display text-3xl font-bold tracking-tight";
export const h2 = "text-[17px] font-semibold";

const PLATFORM_COLOURS: Record<Platform, string> = {
  linkedin: "bg-[#0a66c2]",
  instagram_facebook: "bg-[#b4266e]",
  tiktok: "bg-[#111111]",
};

/** A coloured label for a platform, so each one is easy to spot on a busy board. */
export function platformChip(platform: Platform): string {
  return `rounded-full px-3 py-1 text-[13px] font-semibold text-white ${PLATFORM_COLOURS[platform] ?? "bg-plum"}`;
}
