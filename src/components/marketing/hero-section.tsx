"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroPreview } from "./hero-preview";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-28 pt-12 md:pb-36 md:pt-20">
      <div
        className="hero-glow -top-24 left-1/2 h-72 w-72 -translate-x-1/2 bg-primary/30 md:h-96 md:w-96"
        aria-hidden
      />
      <div
        className="hero-glow top-1/3 right-0 h-48 w-48 bg-accent/25"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Micro UGC intelligence
          </p>
          <h1 className="font-display mt-5 max-w-xl text-4xl font-normal leading-[1.08] tracking-tight text-foreground md:text-6xl md:leading-[1.02]">
            Rank creators by{" "}
            <span className="text-gradient-radium">business impact</span>, not
            vanity metrics.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Official APIs feed four scoring engines — authenticity, growth,
            brand fit, and campaign prediction — built for brands hiring micro
            creators, not chasing follower counts.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/analyze"
              className="btn-primary-glow inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110"
            >
              Analyze a creator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-primary/[0.08]"
            >
              Compare two creators
            </Link>
          </div>
          <dl className="mt-14 grid grid-cols-3 gap-4 border-t border-primary/15 pt-10 sm:gap-6">
            {[
              { n: "4", label: "Scoring engines" },
              { n: "3", label: "Live platforms" },
              { n: "0", label: "Demo profiles" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="font-display text-3xl tabular-nums text-foreground md:text-4xl">
                  {s.n}
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-w-0 lg:pl-2">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
