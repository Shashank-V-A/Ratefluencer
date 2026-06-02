"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const METRICS = [
  { label: "Authenticity", value: 91 },
  { label: "Growth", value: 84 },
  { label: "Brand match", value: 88 },
];

export function HeroPreview() {
  return (
    <div className="glass-panel motion-safe-float relative overflow-hidden rounded-3xl p-6 md:p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Sample report</p>
          <p className="font-display mt-2 text-2xl text-foreground">RankMint</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Scored from live API metrics
          </p>
        </div>
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <span className="font-display text-2xl tabular-nums">87</span>
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">
            Score
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {METRICS.map((m, i) => (
          <div key={m.label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">{m.label}</span>
              <span className="tabular-nums font-semibold text-foreground">
                {m.value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-orange-300"
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{
                  delay: 0.4 + i * 0.12,
                  duration: 0.8,
                  ease: EASE,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 border-t border-border pt-6">
        {["YouTube", "X"].map((p) => (
          <div
            key={p}
            className="rounded-xl border border-border bg-muted/40 px-2 py-2 text-center text-[10px] font-medium text-muted-foreground"
          >
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}
