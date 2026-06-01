/** Abstract UI preview — illustrative layout only, not live creator data */

const METRICS = [
  { label: "Authenticity", value: 91, width: "91%" },
  { label: "Growth", value: 84, width: "84%" },
  { label: "Brand match", value: 88, width: "88%" },
];

export function HeroPreview() {
  return (
    <div className="glass-panel relative w-full overflow-hidden p-6 md:p-8">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Intelligence preview
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight text-foreground">
            RankMint™
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Live API · scored at analysis time
          </p>
        </div>
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
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
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: m.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-8 grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-6">
        {["YouTube", "X", "Instagram"].map((p) => (
          <div
            key={p}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-2 text-center"
          >
            <p className="text-[10px] text-muted-foreground">{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
