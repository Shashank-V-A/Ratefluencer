import {
  Shield,
  TrendingUp,
  Handshake,
  Layers,
  type LucideIcon,
} from "lucide-react";

const FEATURES: {
  icon: LucideIcon;
  title: string;
  body: string;
  className: string;
}[] = [
  {
    icon: Shield,
    title: "Authenticity",
    body: "Spot purchased followers, engagement pods, and artificial spikes from real post-level signals.",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    icon: TrendingUp,
    title: "Growth",
    body: "90-day momentum forecasts from live follower and engagement trajectories.",
    className: "md:col-span-1",
  },
  {
    icon: Handshake,
    title: "Brand match",
    body: "Embedding similarity against your brand catalog — not generic niche tags.",
    className: "md:col-span-1",
  },
  {
    icon: Layers,
    title: "RankMint™",
    body: "Ensemble score predicting campaign fit from commerce-ready UGC signals.",
    className: "md:col-span-2",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
            Scoring stack
          </p>
          <h2 className="font-display mt-4 text-3xl font-normal tracking-tight md:text-4xl">
            Four engines. One score brands can trust.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every number is computed from live API data at the moment you analyze
            — nothing cached from a demo dataset.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {FEATURES.map((item) => (
            <article
              key={item.title}
              className={`glass-panel group p-7 transition-colors duration-300 hover:border-primary/15 ${item.className}`}
            >
              <div className="mb-5 inline-flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 text-primary transition-colors group-hover:border-primary/20 group-hover:bg-primary/10">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
