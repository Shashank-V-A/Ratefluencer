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
import { Loader2, Search } from "lucide-react";

const DEMO_HANDLES = [
  { platform: "instagram" as Platform, handle: "priya.glowdiaries" },
  { platform: "instagram" as Platform, handle: "riya.amazonvault" },
  { platform: "instagram" as Platform, handle: "luxury.deals.daily" },
];

const LIVE_EXAMPLES: Record<Platform, string> = {
  instagram: "nike",
  youtube: "mkbhd",
  x: "naval",
  tiktok: "",
};

type PlatformStatus = Record<string, { configured: boolean }>;

export default function AnalyzePage() {
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [apiStatus, setApiStatus] = useState<PlatformStatus | null>(null);
  const [handle, setHandle] = useState("");
  const [mode, setMode] = useState<"live" | "demo">("live");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    fetch("/api/platforms/status")
      .then((r) => r.json())
      .then((d) => setApiStatus(d.platforms))
      .catch(() => setApiStatus(null));
  }, []);

  const platformReady =
    mode === "demo" ||
    (platform === "youtube" && apiStatus?.youtube?.configured) ||
    (platform === "x" && apiStatus?.x?.configured) ||
    (platform === "instagram" && apiStatus?.instagram?.configured);

  async function runAnalysis(
    targetHandle?: string,
    targetPlatform?: Platform
  ) {
    const h = (targetHandle ?? handle).replace(/^@/, "").trim();
    const p = targetPlatform ?? platform;
    if (!h) return;
    setLoading(true);
    setError(null);
    setWarning(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: h,
          platform: mode === "live" ? p : undefined,
          source: mode,
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
      if (data.warning) setWarning(data.warning);
      setHandle(h);
      if (targetPlatform) setPlatform(targetPlatform);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const reportHref = result
    ? result.meta?.source === "live"
      ? `/report/${encodeLiveReportId(result.profile.platform, result.profile.handle)}`
      : `/creators/${result.profile.id}`
    : "#";

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Analyze a creator
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Pull live metrics from Instagram Graph API, YouTube Data API, or X API
          v2 — then run authenticity, growth, brand match, and Ratefluencer™
          scoring.
        </p>

        <div className="mt-6">
          <ApiStatusBanner />
        </div>

        <div className="mt-8 flex gap-2 rounded-lg border border-border/80 p-1">
          {(["live", "demo"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors ${
                mode === m
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "live" ? "Live APIs" : "Demo dataset"}
            </button>
          ))}
        </div>

        {mode === "live" && (
          <div className="mt-6">
            <PlatformSelector
              value={platform}
              onChange={setPlatform}
              disabled={loading}
            />
          </div>
        )}

        <form
          className="mt-6 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            runAnalysis();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder={
                mode === "live"
                  ? `@${LIVE_EXAMPLES[platform] || "username"}`
                  : "@priya.glowdiaries"
              }
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading || (mode === "live" && !platformReady)}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {mode === "demo"
            ? DEMO_HANDLES.map(({ platform: p, handle: h }) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => runAnalysis(h, p)}
                  className="rounded-full border border-border/80 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  @{h}
                </button>
              ))
            : LIVE_EXAMPLES[platform] && (
                <button
                  type="button"
                  onClick={() => runAnalysis(LIVE_EXAMPLES[platform])}
                  className="rounded-full border border-border/80 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  Try @{LIVE_EXAMPLES[platform]}
                </button>
              )}
        </div>

        {mode === "live" && apiStatus && !platformReady && (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Add <strong>{platform === "youtube" ? "YOUTUBE_API_KEY" : "X_API_BEARER_TOKEN"}</strong> to{" "}
            <code className="rounded bg-black/20 px-1">.env.local</code> in the project
            folder (not .env.example), save, then restart{" "}
            <code className="rounded bg-black/20 px-1">npm run dev</code>.
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {warning && (
          <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
            {warning}
          </p>
        )}

        {result?.meta?.warnings?.map((w) => (
          <p
            key={w}
            className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90"
          >
            {w}
          </p>
        ))}

        {result && (
          <div className="mt-10 rounded-2xl border border-border/80 bg-card/50 p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <ScoreRing
                score={result.scores.ratefluencer}
                size={140}
                label="Ratefluencer™"
              />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display text-2xl font-semibold">
                  {result.profile.displayName}
                </h2>
                <p className="text-muted-foreground">
                  @{result.profile.handle} ·{" "}
                  <span className="capitalize">{result.profile.platform}</span>
                </p>
                <Link
                  href={reportHref}
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  View full intelligence report →
                </Link>
              </div>
            </div>
            <div className="mt-8">
              <ScoreBreakdownPanel scores={result.scores} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
