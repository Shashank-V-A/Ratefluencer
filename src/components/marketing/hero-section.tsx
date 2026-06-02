"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroPreview } from "./hero-preview";

const EASE = [0.22, 1, 0.36, 1] as const;

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: EASE },
  }),
};

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-24 pt-10 md:pb-32 md:pt-16">
      <div
        className="hero-blob -left-20 top-0 h-72 w-72 bg-orange-200/60"
        aria-hidden
      />
      <div
        className="hero-blob right-0 top-20 h-64 w-64 bg-amber-100/80"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <motion.h1
            custom={0}
            initial="hidden"
            animate="show"
            variants={fade}
            className="font-display max-w-xl text-4xl leading-[1.1] text-foreground md:text-[3.25rem]"
          >
            Rank creators by{" "}
            <span className="text-gradient-brand">business impact</span>, not
            vanity metrics.
          </motion.h1>

          <motion.p
            custom={1}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Live data from YouTube, X, and Instagram powers authenticity,
            growth, brand fit, and your Ratefluencer Score — in seconds.
          </motion.p>

          <motion.div
            custom={2}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/analyze"
              className="btn-primary-glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Analyze a creator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80"
            >
              Compare creators
            </Link>
          </motion.div>

          <motion.dl
            custom={3}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-12 grid grid-cols-3 gap-4 rounded-2xl border border-border/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm sm:gap-6"
          >
            {[
              { n: "5", label: "Scoring engines" },
              { n: "3", label: "Live platforms" },
              { n: "100", label: "Live API only", suffix: "%" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="font-display text-2xl tabular-nums text-foreground md:text-3xl">
                  {s.n}
                  {s.suffix ?? ""}
                </dt>
                <dd className="mt-0.5 text-xs text-muted-foreground">
                  {s.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
          className="relative min-w-0 lg:pl-4"
        >
          <HeroPreview />
        </motion.div>
      </div>
    </section>
  );
}
