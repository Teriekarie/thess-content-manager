"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/week", label: "This week" },
  { href: "/calendar", label: "Calendar" },
  { href: "/inbox", label: "Idea Inbox" },
  { href: "/dates", label: "Holidays and dates" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-lg px-3 ${
              active ? "bg-[#eef0f4] font-semibold" : "font-medium hover:bg-ground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
