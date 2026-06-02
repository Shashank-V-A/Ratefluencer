"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/analyze", label: "Analyze" },
  { href: "/compare", label: "Compare" },
  { href: "/brands", label: "Brands" },
  { href: "/saved", label: "Shortlist" },
  { href: "/methodology", label: "Methodology" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-primary/12 bg-background/75 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/30 to-primary/5 shadow-[0_0_20px_-6px_oklch(0.88_0.24_136/50%)]">
            <span className="font-display text-lg leading-none text-primary">
              R
            </span>
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent to-primary/10" />
          </span>
          <span className="font-display text-[1.35rem] tracking-tight text-foreground">
            Rank<span className="text-primary">Mint</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_oklch(0.88_0.24_136/25%)]"
                    : "text-muted-foreground hover:bg-primary/[0.06] hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/analyze"
          className="btn-primary-glow rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110"
        >
          Analyze
        </Link>
      </div>
    </header>
  );
}
