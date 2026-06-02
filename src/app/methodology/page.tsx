import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Handshake,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageShell, PageTitle } from "@/components/ui/page-shell";
import { getModelMetrics } from "@/lib/ml/model-metrics";

export const metadata = {
  title: "How RankMint scores creators — Methodology",
};

const LIVE_ITEMS = [
  "Profile, bio, followers, following",
  "Likes, comments, shares, saves, views",
  "Posting frequency (last 30 / 90 days)",
  "YouTube · X APIs",
];

type ScoreCard = {
  icon: LucideIcon;
  title: string;
  range: string;
  source: string;
  lines: string[];
  subtitle?: string;
  highlight?: boolean;
};

const SCORES: ScoreCard[] = [
  {
    icon: Shield,
    title: "Authenticity",
    range: "0-100",
    source: "Heuristic",
    lines: [
      "Purchased followers",
      "Engagement pods",
      "Bot activity",
      "Artificial spikes",
    ],
  },
  {
    icon: TrendingUp,
    title: "Growth potential",
    range: "0-100",
    source: "Modeled",
    lines: [
      "90-day follower growth",
      "Engagement growth",
      "Audience expansion",
    ],
  },
  {
    icon: Handshake,
    title: "Brand match",
    range: "0-100",
    source: "Embeddings + RAG",
    lines: [
      "Creator to brand similarity",
      "pgvector retrieval",
      "Commerce signal rerank",
    ],
  },
  {
    icon: BarChart3,
    title: "Campaign success",
    range: "0-100%",
    source: "ML",
    lines: [
      "Logistic regression",
      "Engagement and consistency features",
      "Trained on campaign labels",
    ],
  },
  {
    icon: Sparkles,
    title: "RankMint",
    subtitle: "Ratefluencer Score",
    range: "0-100",
    source: "ML composite",
    lines: [
      "Ranks creators by business impact",
      "Not follower count alone",
      "Tier calibration for mega creators",
    ],
    highlight: true,
  },
];

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
      {label}
    </span>
  );
}

export default function MethodologyPage() {
  const metrics = getModelMetrics();
  return (
    <PageShell wide className="pb-20">
      <PageTitle subtitle="Live platform data + ML scores. Every number on a report maps to one of the sections below.">
        Scoring methodology
      </PageTitle>

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 text-primary">
            <Radio className="h-4 w-4" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Live from APIs
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {LIVE_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Modeled and inferred
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              RankMint, growth, campaign success - trained ML
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              Brand match - embeddings + optional OpenAI upgrade
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              Demographics - inferred from location and content niche
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              Authenticity - heuristics, not a fraud-vendor API
            </li>
          </ul>
        </div>
      </div>
      {metrics && (
        <div className="glass-panel mb-10 rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
            Model credibility
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs text-muted-foreground">Dataset</p>
              <p className="font-display text-sm">{metrics.dataset ?? "campaign_labels.csv"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rows</p>
              <p className="font-display text-sm">{metrics.rows ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="font-display text-sm">
                {typeof metrics.testAccuracy === "number"
                  ? `${(metrics.testAccuracy * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AUC</p>
              <p className="font-display text-sm">
                {typeof metrics.auc === "number" ? metrics.auc.toFixed(3) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">F1</p>
              <p className="font-display text-sm">
                {typeof metrics.f1 === "number" ? metrics.f1.toFixed(3) : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary/80">
        Five scoring engines
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCORES.map((score) => {
          const Icon = score.icon;
          return (
            <div
              key={score.title}
              className={
                score.highlight
                  ? "glass-panel rounded-2xl border-primary/30 p-5 ring-1 ring-primary/20"
                  : "glass-panel rounded-2xl p-5"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg leading-tight">
                      {score.title}
                    </h2>
                    {score.subtitle && (
                      <p className="text-[11px] text-muted-foreground">
                        {score.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-display text-sm tabular-nums text-primary">
                  {score.range}
                </span>
              </div>
              <div className="mt-3">
                <SourceBadge label={score.source} />
              </div>
              <ul className="mt-4 space-y-1.5">
                {score.lines.map((line) => (
                  <li key={line} className="text-sm text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="glass-panel rounded-2xl p-5 sm:col-span-2 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Users className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="font-display text-lg">Audience demographics</h2>
                <p className="text-sm text-muted-foreground">
                  Age, country, gender on every report
                </p>
              </div>
            </div>
            <SourceBadge label="Inferred" />
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Built from creator location, content niche, and platform benchmarks.
            Platform Insights OAuth overrides when connected.
          </p>
        </div>
      </div>

      <div className="glass-panel mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Add brands in{" "}
          <Link href="/brands" className="text-primary hover:underline">
            Brand workspace
          </Link>{" "}
          · Retrain model with{" "}
          <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary/90">
            npm run ml:train
          </code>
        </p>
        <Link
          href="/analyze"
          className="btn-primary-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Analyze a creator
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PageShell>
  );
}
