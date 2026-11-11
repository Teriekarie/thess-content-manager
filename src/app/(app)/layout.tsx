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
    <div className="flex min-h-screen flex-wrap">
      <nav
        aria-label="Main"
        className="flex flex-[1_1_220px] flex-col gap-1 border-r border-line bg-surface px-4 py-6 md:max-w-[260px]"
      >
        <p className="px-3 pb-4 font-display text-lg font-bold">Content Manager</p>
        <NavLinks />
        <form action={signOut} className="mt-6 border-t border-line px-3 pt-4">
          <p className="truncate text-sm text-muted">{owner.email}</p>
          <button type="submit" className="min-h-11 text-sm font-semibold underline">
            Sign out
          </button>
        </form>
      </nav>
      <main className="min-w-0 flex-[999_1_560px] p-6 md:p-8">{children}</main>
    </div>
  );
}
