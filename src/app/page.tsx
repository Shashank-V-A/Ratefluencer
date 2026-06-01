import Link from "next/link";
import { analyzeAllCreators } from "@/lib/analyze";
import { CreatorCard } from "@/components/creator-card";
import { ScoreRing } from "@/components/score-ring";
import { ArrowRight, Sparkles, Shield, TrendingUp, Handshake } from "lucide-react";

export default function HomePage() {
  const ranked = analyzeAllCreators().slice(0, 3);
  const top = ranked[0]!;

  return (
    <>
      <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Built for micro UGC & short-form commerce
          </p>
          <h1 className="font-display max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl md:leading-[1.05]">
            Rank creators by{" "}
            <span className="text-primary">business impact</span>, not follower
            count.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Ratefluencer is an intelligence engine for skincare routines, Amazon
            finds, café reels, campus lifestyle, and budget fashion creators —
            the voices people actually trust before they buy.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Analyze live (IG · YouTube · X)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Demo rankings
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              API setup
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/30 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Live demo · top micro creator
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold">
              {top.profile.displayName}
            </h2>
            <p className="mt-1 text-muted-foreground">
              @{top.profile.handle} · {top.profile.nicheLabel}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Campaign success probability
                </dt>
                <dd className="font-display mt-1 text-2xl tabular-nums">
                  {top.scores.campaignSuccessProbability}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Authenticity score
                </dt>
                <dd className="font-display mt-1 text-2xl tabular-nums text-score-high">
                  {top.scores.authenticity}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex justify-center md:justify-end">
            <ScoreRing
              score={top.scores.ratefluencer}
              size={200}
              strokeWidth={10}
              label="Ratefluencer™"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-2xl font-semibold md:text-3xl">
            Four engines. One score brands can trust.
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Authenticity",
                body: "Detect purchased followers, engagement pods, bots, and artificial spikes.",
              },
              {
                icon: TrendingUp,
                title: "Growth",
                body: "Forecast 90-day follower, engagement, and audience expansion.",
              },
              {
                icon: Handshake,
                title: "Brand match",
                body: "NLP embeddings + similarity search + RAG-style brand retrieval.",
              },
              {
                icon: Sparkles,
                title: "Ratefluencer™",
                body: "Ensemble ML predicting campaign success from commerce signals.",
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

      <section className="border-t border-border/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Top micro creators
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked by Ratefluencer Score™ — not vanity metrics
              </p>
            </div>
            <Link
              href="/creators"
              className="hidden text-sm text-primary hover:underline sm:inline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ranked.map((analysis) => (
              <CreatorCard key={analysis.profile.id} analysis={analysis} />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-10 text-center text-xs text-muted-foreground">
        Ratefluencer Intelligence Engine · Micro UGC & Short-Form Commerce
      </footer>
    </>
  );
}
