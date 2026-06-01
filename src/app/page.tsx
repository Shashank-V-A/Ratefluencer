import Link from "next/link";
import { ArrowRight, Sparkles, Shield, TrendingUp, Handshake } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Live data · Instagram · YouTube · X
          </p>
          <h1 className="font-display max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl md:leading-[1.05]">
            Rank creators by{" "}
            <span className="text-primary">business impact</span>, not follower
            count.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Ratefluencer pulls real metrics from official APIs, then scores
            micro UGC creators on authenticity, growth, brand fit, and predicted
            campaign success — no vanity dashboards, no fake profiles.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Analyze a creator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Compare two creators
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-2xl font-semibold md:text-3xl">
            Four engines. One score brands can trust.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
            Every score is computed from live API data at analysis time.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Authenticity",
                body: "Detect purchased followers, engagement pods, bots, and artificial spikes from real posts.",
              },
              {
                icon: TrendingUp,
                title: "Growth",
                body: "Forecast 90-day follower, engagement, and audience expansion from current momentum.",
              },
              {
                icon: Handshake,
                title: "Brand match",
                body: "NLP embeddings + similarity search against real brand profiles.",
              },
              {
                icon: Sparkles,
                title: "Ratefluencer™",
                body: "ML ensemble predicting campaign success from live commerce signals.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/70 bg-card/40 p-6"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-10 text-center text-xs text-muted-foreground">
        Ratefluencer Intelligence Engine · Live micro-UGC analytics
      </footer>
    </>
  );
}
