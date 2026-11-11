export default function HomePage() {
  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Home</h1>
        <p className="mt-1 text-muted">You are signed in. The foundation is ready.</p>
      </header>
      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold">What works today</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>Private sign-in for the owner only.</li>
          <li>Every page is locked unless you are signed in.</li>
          <li>A secure database, ready for your ideas and posts.</li>
        </ul>
        <p className="mt-4 text-muted">
          Your dashboard numbers (generated, posted, liked) appear here in Phase 1a.
        </p>
      </section>
    </div>
  );
}
