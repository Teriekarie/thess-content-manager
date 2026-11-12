/** Shown straight away while a page's data loads, so moving between sections feels instant. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex max-w-[1240px] animate-pulse flex-col gap-6">
      <span className="sr-only">Loading</span>
      <div className="h-9 w-56 rounded-xl bg-line" />
      <div className="h-5 w-80 max-w-full rounded-lg bg-line" />
      <div className="h-40 rounded-2xl bg-surface shadow-sm" />
      <div className="h-40 rounded-2xl bg-surface shadow-sm" />
    </div>
  );
}
