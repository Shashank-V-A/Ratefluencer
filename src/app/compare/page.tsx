"use client";

import { useState } from "react";
import type { AnalysisResult, Platform } from "@/lib/types";
import { PlatformSelector } from "@/components/platform-selector";
import { ScoreRing } from "@/components/score-ring";
import { formatFollowers } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ApiStatusBanner } from "@/components/api-status-banner";

async function fetchAnalysis(
  platform: Platform,
  handle: string
): Promise<AnalysisResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform,
      handle: handle.replace(/^@/, "").trim(),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error([data.error, data.hint].filter(Boolean).join(" — "));
  }
  return data as AnalysisResult;
}

export default function ComparePage() {
  const [platformA, setPlatformA] = useState<Platform>("youtube");
  const [platformB, setPlatformB] = useState<Platform>("x");
  const [handleA, setHandleA] = useState("mkbhd");
  const [handleB, setHandleB] = useState("naval");
  const [left, setLeft] = useState<AnalysisResult | null>(null);
  const [right, setRight] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compare() {
    setLoading(true);
    setError(null);
    setLeft(null);
    setRight(null);
    try {
      const [a, b] = await Promise.all([
        fetchAnalysis(platformA, handleA),
        fetchAnalysis(platformB, handleB),
      ]);
      setLeft(a);
      setRight(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  if (!left || !right) {
    return (
      <div className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-3xl font-semibold">
            Compare creators
          </h1>
          <p className="mt-3 text-muted-foreground">
            Side-by-side intelligence from live API data — two real profiles,
            analyzed in parallel.
          </p>
          <div className="mt-6">
            <ApiStatusBanner />
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-border/80 p-6">
              <p className="text-sm font-medium">Creator A</p>
              <PlatformSelector
                value={platformA}
                onChange={setPlatformA}
                disabled={loading}
              />
              <Input
                placeholder="@handle"
                value={handleA}
                onChange={(e) => setHandleA(e.target.value)}
              />
            </div>
            <div className="space-y-4 rounded-2xl border border-border/80 p-6">
              <p className="text-sm font-medium">Creator B</p>
              <PlatformSelector
                value={platformB}
                onChange={setPlatformB}
                disabled={loading}
              />
              <Input
                placeholder="@handle"
                value={handleB}
                onChange={(e) => setHandleB(e.target.value)}
              />
            </div>
          </div>
          <Button className="mt-8" onClick={compare} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Compare live"
            )}
          </Button>
          {error && (
            <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: "Ratefluencer™",
      l: left.scores.ratefluencer,
      r: right.scores.ratefluencer,
    },
    {
      label: "Authenticity",
      l: left.scores.authenticity,
      r: right.scores.authenticity,
    },
    {
      label: "Growth potential",
      l: left.scores.growthPotential,
      r: right.scores.growthPotential,
    },
    {
      label: "Brand match",
      l: left.scores.brandMatch,
      r: right.scores.brandMatch,
    },
    {
      label: "Campaign success %",
      l: left.scores.campaignSuccessProbability,
      r: right.scores.campaignSuccessProbability,
    },
    {
      label: "Followers",
      l: left.profile.metrics.followers,
      r: right.profile.metrics.followers,
      format: true,
    },
  ];

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold">Comparison</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLeft(null);
              setRight(null);
            }}
          >
            New comparison
          </Button>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {[left, right].map((a) => (
            <div
              key={a.profile.id}
              className="flex flex-col items-center rounded-2xl border border-border/80 bg-card/40 p-8"
            >
              <ScoreRing score={a.scores.ratefluencer} size={120} />
              <h2 className="mt-4 font-display text-xl font-semibold text-center">
                {a.profile.displayName}
              </h2>
              <p className="text-sm text-muted-foreground">@{a.profile.handle}</p>
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                {a.profile.platform} · live
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium">Metric</th>
                <th className="px-4 py-3 text-right font-medium">
                  {left.profile.displayName.split(" ")[0]}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {right.profile.displayName.split(" ")[0]}
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((row) => {
                const lVal = row.format
                  ? formatFollowers(row.l as number)
                  : row.l;
                const rVal = row.format
                  ? formatFollowers(row.r as number)
                  : row.r;
                const lNum = row.l as number;
                const rNum = row.r as number;
                const winner =
                  !row.format && lNum !== rNum
                    ? lNum > rNum
                      ? "left"
                      : "right"
                    : null;
                return (
                  <tr
                    key={row.label}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.label}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-display tabular-nums ${
                        winner === "left" ? "text-score-high" : ""
                      }`}
                    >
                      {lVal}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-display tabular-nums ${
                        winner === "right" ? "text-score-high" : ""
                      }`}
                    >
                      {rVal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
