import { NavLinks } from "@/components/nav-links";
import { requireOwner } from "@/lib/auth/session";
import { signOut } from "../login/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await requireOwner();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <nav
        aria-label="Main"
        className="flex shrink-0 flex-col gap-1 bg-plum px-3 py-3 text-white md:sticky md:top-0 md:h-screen md:w-[248px] md:px-4 md:py-6"
      >
        <div className="flex items-center gap-3 px-2 pb-2 md:pb-5">
          <span aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold font-display text-lg font-bold text-plum">
            T
          </span>
          <span className="font-display text-lg font-bold">Content Manager</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          <NavLinks />
        </div>
        <form action={signOut} className="mt-auto hidden border-t border-white/15 px-2 pt-4 md:block">
          <p className="truncate text-sm text-[#d9cbe6]">{owner.email}</p>
          <button type="submit" className="min-h-11 text-sm font-semibold text-white underline">
            Sign out
          </button>
        </form>
      </nav>
      <main className="min-w-0 flex-1 p-5 md:p-10">
        {children}
        <form action={signOut} className="mt-10 border-t border-line pt-4 md:hidden">
          <span className="text-sm text-muted">{owner.email} · </span>
          <button type="submit" className="min-h-11 text-sm font-semibold underline">Sign out</button>
        </form>
      </main>
    </div>
  );
}
