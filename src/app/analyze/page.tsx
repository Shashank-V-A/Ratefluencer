"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisResult, Platform } from "@/lib/types";
import { encodeLiveReportId } from "@/lib/report-id";
import { ScoreRing } from "@/components/score-ring";
import { ScoreBreakdownPanel } from "@/components/score-breakdown";
import { PlatformSelector } from "@/components/platform-selector";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassPanel, PageShell, PageTitle } from "@/components/ui/page-shell";
import { Loader2, Search } from "lucide-react";

const EXAMPLES: Partial<Record<Platform, string>> = {
  youtube: "mkbhd",
  x: "naval",
  instagram: "nike",
};

type PlatformStatus = Record<string, { configured: boolean }>;

export default function AnalyzePage() {
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [apiStatus, setApiStatus] = useState<PlatformStatus | null>(null);
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    fetch("/api/platforms/status")
      .then((r) => r.json())
      .then((d) => setApiStatus(d.platforms))
      .catch(() => setApiStatus(null));
  }, []);

  const platformReady =
    (platform === "youtube" && apiStatus?.youtube?.configured) ||
    (platform === "x" && apiStatus?.x?.configured) ||
    (platform === "instagram" && apiStatus?.instagram?.configured);

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
        body: JSON.stringify({ handle: h, platform }),
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
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const reportHref = result
    ? `/report/${encodeLiveReportId(result.profile.platform, result.profile.handle)}`
    : "#";

  return (
    <PageShell narrow>
      <PageTitle
        subtitle="Live lookup via YouTube Data API, X API v2, or Instagram Graph. Scores refresh from real metrics every time."
      >
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
              className="h-10 border-primary/15 bg-primary/[0.04] pl-10 focus-visible:border-primary/35"
              placeholder={`@${EXAMPLES[platform] ?? "username"}`}
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

        {EXAMPLES[platform] && (
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => runAnalysis(EXAMPLES[platform])}
            className="text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            Try @{EXAMPLES[platform]}
          </button>
        )}
      </GlassPanel>

      <div className="mt-6 space-y-4">
        {apiStatus && !platformReady && (
          <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Configure{" "}
            <strong>
              {platform === "youtube"
                ? "YOUTUBE_API_KEY"
                : platform === "x"
                  ? "X_API_BEARER_TOKEN"
                  : "Instagram Meta credentials"}
            </strong>{" "}
            in <code className="rounded bg-black/20 px-1">.env.local</code>, then
            restart <code className="rounded bg-black/20 px-1">npm run dev</code>.
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {result?.meta?.warnings?.map((w) => (
          <p
            key={w}
            className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100/90"
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
              <div className="flex-1 text-center sm:text-left">
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
            <div className="mt-8 border-t border-primary/12 pt-8">
              <ScoreBreakdownPanel scores={result.scores} />
            </div>
          </GlassPanel>
        )}
      </div>
    </PageShell>
  );
}
