import { ReportActions } from "@/components/report-actions";
import Link from "next/link";
import { DemographicsPanel } from "@/components/demographics-panel";
import { AuthenticityPanel } from "@/components/authenticity-panel";
import { BrandMatchList } from "@/components/brand-match-list";
import { FeatureImportanceChart } from "@/components/feature-importance-chart";
import { ScoreBreakdownPanel } from "@/components/score-breakdown";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { formatFollowers } from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

export function CreatorReportView({
  analysis,
  backHref = "/analyze",
  backLabel = "Back to analyze",
}: {
  analysis: AnalysisResult;
  backHref?: string;
  backLabel?: string;
}) {
  const { profile, scores, growthForecast, featureImportance, modelVersion, meta } =
    analysis;
  const m = profile.metrics;
  const engagementRate =
    ((m.likes + m.comments + m.shares + m.saves) / Math.max(m.followers, 1)) *
    100;

  const viewsLabel =
    profile.platform === "youtube"
      ? "Avg video views"
      : profile.platform === "x"
        ? "Avg impressions"
        : "Avg reel views";

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <ReportActions analysis={analysis} />

        {meta?.warnings?.map((w) => (
          <p
            key={w}
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {w}
          </p>
        ))}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="flex flex-wrap items-start gap-6">
              <ProfileAvatar
                name={profile.displayName}
                avatarUrl={meta?.avatarUrl}
                avatarGradient={profile.avatarGradient}
                size={64}
              />
              <div>
                <h1 className="font-display text-3xl font-semibold">
                  {profile.displayName}
                </h1>
                <p className="text-muted-foreground">@{profile.handle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {profile.platform}
                  </Badge>
                  {profile.location !== "—" && (
                    <Badge variant="outline">{profile.location}</Badge>
                  )}
                  {meta?.profileUrl && (
                    <a
                      href={meta.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View profile <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {profile.bio || "No bio available."}
                </p>
                {(meta?.confidence || meta?.sampleSize || meta?.freshnessMinutes != null) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Confidence {meta?.confidence ?? "—"}% · Sample size {meta?.sampleSize ?? "—"} ·
                    Freshness{" "}
                    {typeof meta?.freshnessMinutes === "number"
                      ? meta.freshnessMinutes <= 1
                        ? "just now"
                        : `${meta.freshnessMinutes} min`
                      : "—"}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Followers", value: formatFollowers(m.followers) },
                {
                  label: "Engagement rate",
                  value: `${engagementRate.toFixed(2)}%`,
                },
                { label: viewsLabel, value: formatFollowers(m.avgReelViews) },
                { label: "Posts / 30d", value: String(m.postsLast30Days) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-display mt-1 text-xl tabular-nums">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-card/40 p-6">
                <h2 className="font-display text-lg font-semibold">
                  Score breakdown
                </h2>
                <div className="mt-6">
                  <ScoreBreakdownPanel
                    scores={scores}
                    explainability={analysis.explainability}
                    freshnessMinutes={meta?.freshnessMinutes}
                  />
                </div>
              </div>
              <AuthenticityPanel
                score={scores.authenticity}
                flags={analysis.authenticityFlags}
              />
            </div>
            {analysis.explainability && (
              <div className="mt-4 rounded-2xl border border-border/80 bg-card/40 p-6">
                <h2 className="font-display text-lg font-semibold">
                  Explainability highlights
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {analysis.explainability.rankMint.summary}
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {analysis.explainability.rankMint.positives.slice(0, 2).map((p) => (
                    <li key={p}>+ {p}</li>
                  ))}
                  {analysis.explainability.rankMint.negatives.slice(0, 2).map((n) => (
                    <li key={n}>- {n}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-border/80 bg-card/40 p-6">
              <h2 className="font-display text-lg font-semibold">
                Growth forecast (90 days, modeled)
              </h2>
              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/25 p-4">
                  <dt className="text-xs text-muted-foreground">
                    Follower growth
                  </dt>
                  <dd className="font-display mt-1 text-2xl text-score-high">
                    +{growthForecast.followerGrowth90d}%
                  </dd>
                </div>
                <div className="rounded-lg bg-muted/25 p-4">
                  <dt className="text-xs text-muted-foreground">
                    Engagement growth
                  </dt>
                  <dd className="font-display mt-1 text-2xl">
                    +{growthForecast.engagementGrowth90d}%
                  </dd>
                </div>
                <div className="rounded-lg bg-muted/25 p-4">
                  <dt className="text-xs text-muted-foreground">
                    Audience expansion
                  </dt>
                  <dd className="font-display mt-1 text-2xl">
                    +{growthForecast.audienceExpansion}%
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6">
              <DemographicsPanel demographics={profile.demographics} />
            </div>

            <div className="mt-6 rounded-2xl border border-border/80 bg-card/40 p-6">
              <h2 className="font-display text-lg font-semibold">
                Brand partnership recommendations
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Match scores for the brands you selected on Analyze
              </p>
              <div className="mt-6">
                {analysis.brandRecommendations.length > 0 ? (
                  <BrandMatchList
                    recommendations={analysis.brandRecommendations}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No brands selected for analysis. Add brands on the{" "}
                    <a href="/brands" className="text-primary hover:underline">
                      Brand workspace
                    </a>{" "}
                    and enable &quot;Include in full analysis&quot;, then run
                    Analyze again.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border/80 bg-card/40 p-6">
              <h2 className="font-display text-lg font-semibold">
                ML feature importance
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Trained logistic model · {modelVersion}
              </p>
              <div className="mt-6">
                <FeatureImportanceChart data={featureImportance} />
              </div>
            </div>
            {analysis.modelMetrics && (
              <div className="mt-6 rounded-2xl border border-border/80 bg-card/40 p-6">
                <h2 className="font-display text-lg font-semibold">
                  Model credibility
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Dataset {analysis.modelMetrics.dataset} · Rows {analysis.modelMetrics.rows} ·
                  Accuracy {(analysis.modelMetrics.testAccuracy * 100).toFixed(1)}%
                  {typeof analysis.modelMetrics.auc === "number" &&
                    ` · AUC ${analysis.modelMetrics.auc.toFixed(3)}`}
                  {typeof analysis.modelMetrics.f1 === "number" &&
                    ` · F1 ${analysis.modelMetrics.f1.toFixed(3)}`}
                </p>
                {analysis.modelMetrics.lastTrainedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Trained at {analysis.modelMetrics.lastTrainedAt}
                  </p>
                )}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
              <ScoreRing
                score={scores.rankMint}
                size={160}
                strokeWidth={9}
                label="RankMint™"
              />
              <p className="mt-6 text-sm text-muted-foreground">
                Estimated campaign success (modeled)
              </p>
              <p className="font-display text-3xl tabular-nums text-primary">
                {scores.campaignSuccessProbability}%
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
