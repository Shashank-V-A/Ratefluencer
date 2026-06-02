"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult, CompareObjective, Platform } from "@/lib/types";
import { PlatformSelector } from "@/components/platform-selector";
import { ScoreRing } from "@/components/score-ring";
import { formatFollowers } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassPanel, PageShell, PageTitle } from "@/components/ui/page-shell";
import { Loader2 } from "lucide-react";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

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
  const [objective, setObjective] = useState<CompareObjective>("roi");

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

  const decision = useMemo(() => {
    if (!left || !right) return null;
    const weights =
      objective === "brand_safety"
        ? { authenticity: 0.6, growth: 0.15, brand: 0.1, success: 0.15 }
        : objective === "growth"
          ? { authenticity: 0.1, growth: 0.6, brand: 0.1, success: 0.2 }
          : { authenticity: 0.2, growth: 0.2, brand: 0.2, success: 0.4 };
    const scoreOf = (a: AnalysisResult) =>
      a.scores.authenticity * weights.authenticity +
      a.scores.growthPotential * weights.growth +
      a.scores.brandMatch * weights.brand +
      a.scores.campaignSuccessProbability * weights.success;
    const leftScore = scoreOf(left);
    const rightScore = scoreOf(right);
    const winner =
      leftScore >= rightScore
        ? { side: "A" as const, profile: left, other: right, delta: leftScore - rightScore }
        : { side: "B" as const, profile: right, other: left, delta: rightScore - leftScore };
    const reason =
      objective === "brand_safety"
        ? `higher authenticity (${winner.profile.scores.authenticity} vs ${winner.other.scores.authenticity})`
        : objective === "growth"
          ? `stronger growth potential (${winner.profile.scores.growthPotential} vs ${winner.other.scores.growthPotential})`
          : `better campaign success estimate (${winner.profile.scores.campaignSuccessProbability}% vs ${winner.other.scores.campaignSuccessProbability}%)`;
    return {
      winner,
      summary: `Pick ${winner.side} (@${winner.profile.profile.handle}) because it has ${reason} and leads the weighted objective by ${winner.delta.toFixed(1)} points.`,
    };
  }, [left, right, objective]);

  if (!left || !right) {
    return (
      <PageShell>
        <PageTitle subtitle="Side-by-side intelligence from live API data — two profiles analyzed in parallel.">
          Compare creators
        </PageTitle>
        <ApiStatusBanner />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(
            [
              ["Creator A", platformA, setPlatformA, handleA, setHandleA],
              ["Creator B", platformB, setPlatformB, handleB, setHandleB],
            ] as const
          ).map(([label, plat, setPlat, h, setH]) => (
            <GlassPanel key={label} className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {label}
              </p>
              <PlatformSelector
                value={plat}
                onChange={setPlat}
                disabled={loading}
              />
              <Input
                className="border-border bg-white shadow-sm"
                placeholder="@handle"
                value={h}
                onChange={(e) => setH(e.target.value)}
              />
            </GlassPanel>
          ))}
        </div>
        <Button className="mt-8 h-10 px-6" onClick={compare} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Compare live"
          )}
        </Button>
        {error && (
          <p className="mt-6 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </PageShell>
    );
  }

  const metrics = [
    {
      label: "RankMint™",
      l: left.scores.rankMint,
      r: right.scores.rankMint,
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
    <PageShell>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Comparison
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value as CompareObjective)}
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm shadow-sm"
          >
            <option value="roi">Winner by objective: ROI</option>
            <option value="brand_safety">Winner by objective: Brand safety</option>
            <option value="growth">Winner by objective: Growth</option>
          </select>
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
      </div>
      {decision && (
        <p className="mt-6 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {decision.summary}
        </p>
      )}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[left, right].map((a) => (
            <GlassPanel
              key={a.profile.id}
              className="flex flex-col items-center"
            >
              <ProfileAvatar
                name={a.profile.displayName}
                avatarUrl={a.meta?.avatarUrl}
                avatarGradient={a.profile.avatarGradient}
                size={64}
                className="mb-4"
              />
              <ScoreRing score={a.scores.rankMint} size={120} />
              <h2 className="mt-4 text-center font-display text-xl tracking-tight">
                {a.profile.displayName}
              </h2>
              <p className="text-sm text-muted-foreground">@{a.profile.handle}</p>
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                {a.profile.platform} · live
              </p>
            </GlassPanel>
          ))}
        </div>

      <div className="glass-panel mt-10 overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
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
                    className="border-b border-border last:border-0"
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
    </PageShell>
  );
}
