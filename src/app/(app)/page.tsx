import Link from "next/link";
import { btnPrimary, btnSecondary, card, h1, h2 } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <header>
        <h1 className={h1}>Home</h1>
        <p className="mt-1 text-muted">Turn a rough thought into a post you can copy.</p>
      </header>
      <section className={`${card} flex flex-col gap-4`}>
        <h2 className={h2}>How to use it</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-muted">
          <li>In Settings, check your details and paste some of your own writing to set your voice.</li>
          <li>In the Idea Inbox, save a thought or learning note and press Create draft.</li>
          <li>Review the draft, copy it to LinkedIn, then mark it Posted.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Link href="/inbox" className={btnPrimary}>Add an idea</Link>
          <Link href="/week" className={btnSecondary}>This week</Link>
          <Link href="/settings" className={btnSecondary}>Settings</Link>
        </div>
        <p className="text-sm text-muted">
          Your dashboard numbers (generated, posted, liked) appear here in the next update.
        </p>
      </section>
    </div>
  );
}
