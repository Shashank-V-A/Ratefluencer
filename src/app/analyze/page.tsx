"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisResult, Platform } from "@/lib/types";
import {
  buildReportBrandQuery,
  encodeLiveReportId,
} from "@/lib/report-id";
import { ScoreRing } from "@/components/score-ring";
import { ScoreBreakdownPanel } from "@/components/score-breakdown";
import { PlatformSelector } from "@/components/platform-selector";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassPanel, PageShell, PageTitle } from "@/components/ui/page-shell";
import { Loader2, Search } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { BrandAnalysisPicker } from "@/components/brand-analysis-picker";

type PlatformStatus = Record<string, { configured: boolean }>;

export default function AnalyzePage() {
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [apiStatus, setApiStatus] = useState<PlatformStatus | null>(null);
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [brandWeights, setBrandWeights] = useState({
    nicheFit: 50,
    geographyFit: 15,
    engagementQuality: 35,
  });
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/platforms/status")
      .then((r) => r.json())
      .then((d) => setApiStatus(d.platforms))
      .catch(() => setApiStatus(null));
  }, []);

  const platformReady =
    (platform === "youtube" && apiStatus?.youtube?.configured) ||
    (platform === "x" && apiStatus?.x?.configured);

  async function runAnalysis(targetHandle?: string) {
    const h = (targetHandle ?? handle).replace(/^@/, "").trim();
    if (!h) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: h,
          platform,
          skipCache: forceRefresh,
          brandWeights: {
            nicheFit: brandWeights.nicheFit,
            geographyFit: brandWeights.geographyFit,
            engagementQuality: brandWeights.engagementQuality,
          },
          brandIds: selectedBrandIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Analysis failed"
        );
        return;
      }
      setResult(data as AnalysisResult);
      setHandle(h);
      setToast(
        forceRefresh
          ? "Fetched fresh live data (cache bypassed)."
          : "Analysis updated."
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const reportHref = result
    ? `/report/${encodeLiveReportId(result.profile.platform, result.profile.handle)}${buildReportBrandQuery(
        result.meta?.brandIds?.length
          ? result.meta.brandIds
          : selectedBrandIds
      )}`
    : "#";

  return (
    <PageShell narrow>
      <PageTitle>
        Analyze a creator
      </PageTitle>

      <ApiStatusBanner />

      <GlassPanel className="mt-8 space-y-6">
        <PlatformSelector
          value={platform}
          onChange={setPlatform}
          disabled={loading}
        />

        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            runAnalysis();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 border-border bg-white pl-10 shadow-sm"
              placeholder="@username"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="h-10 px-5"
            disabled={loading || !platformReady}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </Button>
        </form>

        <BrandAnalysisPicker
          selectedIds={selectedBrandIds}
          onSelectedIdsChange={setSelectedBrandIds}
          disabled={loading}
        />

        <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Brand match priorities</p>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
              />
              Force refresh live data
            </label>
          </div>
          {(
            [
              ["nicheFit", "Niche fit"],
              ["geographyFit", "Geography fit"],
              ["engagementQuality", "Engagement quality"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{label}</span>
                <span>{brandWeights[key]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={brandWeights[key]}
                onChange={(e) =>
                  setBrandWeights((prev) => ({
                    ...prev,
                    [key]: Number(e.target.value),
                  }))
                }
                className="w-full accent-primary"
              />
            </label>
          ))}
        </div>
      </GlassPanel>

      <div className="mt-6 space-y-4">
        {apiStatus && !platformReady && (
          <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Configure{" "}
            <strong>
              {platform === "youtube" ? "YOUTUBE_API_KEY" : "X_API_BEARER_TOKEN"}
            </strong>{" "}
            in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>, then
            restart <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run dev</code>.
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive space-x-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => runAnalysis()}
              className="font-medium underline"
            >
              Retry
            </button>
          </p>
        )}
        {toast && (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
            {toast}
          </p>
        )}
        {loading && (
          <GlassPanel className="mt-4 animate-pulse">
            <div className="h-5 w-36 rounded bg-muted" />
            <div className="mt-4 h-4 w-52 rounded bg-muted" />
            <div className="mt-6 space-y-3">
              <div className="h-2 rounded bg-muted" />
              <div className="h-2 rounded bg-muted" />
              <div className="h-2 rounded bg-muted" />
            </div>
          </GlassPanel>
        )}

        {result?.meta?.warnings?.map((w) => (
          <p
            key={w}
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {w}
          </p>
        ))}

        {result && (
          <GlassPanel className="mt-4">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <ScoreRing
                score={result.scores.rankMint}
                size={140}
                label="RankMint™"
              />
              <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start">
                <ProfileAvatar
                  name={result.profile.displayName}
                  avatarUrl={result.meta?.avatarUrl}
                  avatarGradient={result.profile.avatarGradient}
                  size={72}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="font-display text-2xl tracking-tight">
                    {result.profile.displayName}
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    @{result.profile.handle} ·{" "}
                    <span className="capitalize">{result.profile.platform}</span>
                  </p>
                  <Link
                    href={reportHref}
                    className="mt-4 inline-flex text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    View full intelligence report →
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-border pt-8">
              <ScoreBreakdownPanel
                scores={result.scores}
                explainability={result.explainability}
                freshnessMinutes={result.meta?.freshnessMinutes}
              />
            </div>
          </GlassPanel>
        )}
      </div>
    </PageShell>
  );
}
