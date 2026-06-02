/** Abstract UI preview — illustrative layout only, not live creator data */

const METRICS = [
  { label: "Authenticity", value: 91, width: "91%" },
  { label: "Growth", value: 84, width: "84%" },
  { label: "Brand match", value: 88, width: "88%" },
];

export function HeroPreview() {
  return (
    <div className="glass-panel radium-border relative w-full overflow-hidden p-6 md:p-8">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Intelligence preview
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight text-foreground">
            RankMint™
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Live API · scored at analysis time
          </p>
        </div>
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-primary/35 bg-primary/10 shadow-[0_0_24px_-6px_oklch(0.88_0.24_136/45%)]">
          <span className="font-display text-2xl font-normal tabular-nums text-primary">
            87
          </span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
            Score
          </span>
        </div>
      </div>

      <div className="relative mt-8 space-y-4">
        {METRICS.map((m) => (
          <div key={m.label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">{m.label}</span>
              <span className="tabular-nums text-foreground">{m.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_12px_oklch(0.88_0.24_136/50%)]"
                style={{ width: m.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-8 grid grid-cols-3 gap-2 border-t border-primary/15 pt-6">
        {["YouTube", "X", "Instagram"].map((p) => (
          <div
            key={p}
            className="rounded-lg border border-primary/12 bg-primary/[0.04] px-2 py-2 text-center"
          >
            <p className="text-[10px] text-muted-foreground">{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
