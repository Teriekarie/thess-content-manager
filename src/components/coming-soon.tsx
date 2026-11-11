export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-muted">{description}</p>
      </header>
      <p className="rounded-xl border border-line bg-surface p-6 text-muted">
        This screen is not built yet. It arrives in <strong className="text-ink">{phase}</strong>.
      </p>
    </div>
  );
}
