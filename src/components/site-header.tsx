"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/analyze", label: "Analyze" },
  { href: "/compare", label: "Compare" },
  { href: "/brands", label: "Brands" },
  { href: "/saved", label: "Shortlist" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/methodology", label: "Methodology" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/80 shadow-sm shadow-black/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            R
          </span>
          <span className="font-display text-lg tracking-tight text-foreground">
            RankMint
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border/80 bg-muted/50 p-1 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200",
            pathname === "/"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border bg-white text-foreground hover:bg-muted/60"
          )}
        >
          Home
        </Link>
      </div>
    </header>
  );
}
