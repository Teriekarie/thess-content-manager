"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  week: "M4 6h16M4 12h16M4 18h10",
  calendar: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  inbox: "M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3zM9.5 19h5M10.5 21.5h3",
  dates: "M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z",
  analytics: "M5 20V11M12 20V4M19 20v-6",
  settings: "M4 7h10M18 7h2M4 17h2M10 17h10M16 4.5v5M8 14.5v5",
};

const LINKS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/week", label: "This week", icon: "week" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/inbox", label: "Idea Inbox", icon: "inbox" },
  { href: "/dates", label: "Holidays and dates", icon: "dates" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/week" && pathname.startsWith("/posts"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 whitespace-nowrap transition-colors ${
              active
                ? "bg-white/15 font-semibold text-white"
                : "font-medium text-[#d9cbe6] hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? "#f5b83d" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[icon]} />
            </svg>
            {label}
          </Link>
        );
      })}
    </>
  );
}
