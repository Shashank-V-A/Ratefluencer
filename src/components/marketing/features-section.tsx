"use client";

import { motion } from "framer-motion";
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
    body: "Detect fake followers, pods, bots, and engagement spikes from live post data.",
    className: "md:col-span-2",
  },
  {
    icon: TrendingUp,
    title: "Growth",
    body: "90-day follower, engagement, and audience expansion forecasts.",
    className: "md:col-span-1",
  },
  {
    icon: Handshake,
    title: "Brand match",
    body: "Embeddings + RAG over your brand catalog with commerce reranking.",
    className: "md:col-span-1",
  },
  {
    icon: Layers,
    title: "RankMint score",
    body: "ML composite (Ratefluencer Score) trained on campaign outcome features.",
    className: "md:col-span-2",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Scoring stack</p>
          <h2 className="font-display mt-3 text-3xl text-foreground md:text-4xl">
            Everything Track 1 asks for
          </h2>
          <p className="mt-3 text-muted-foreground">
            Five engines, one report — built for brands picking micro creators
            with data, not guesswork.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {FEATURES.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              whileHover={{ y: -4 }}
              className={`glass-panel group rounded-2xl p-6 transition-shadow hover:shadow-lg ${item.className}`}
            >
              <div className="mb-4 inline-flex rounded-xl bg-accent p-2.5 text-primary">
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
