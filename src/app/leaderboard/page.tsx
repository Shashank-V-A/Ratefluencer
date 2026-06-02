"use client";

import { useMemo, useState } from "react";
import type { CompareObjective, Platform } from "@/lib/types";
import { PageShell, PageTitle, GlassPanel } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { PlatformSelector } from "@/components/platform-selector";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

type Row = {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  avatarGradient: string;
  rankMint: number;
  authenticity: number;
  growthPotential: number;
  brandMatch: number;
  campaignSuccessProbability: number;
  objectiveScore: number;
  profileUrl?: string;
};

function parseCsv(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => line.split(","))
    .map((s) => s.trim().replace(/^@/, ""))
    .filter(Boolean);
}

export default function LeaderboardPage() {
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [objective, setObjective] = useState<CompareObjective>("roi");
  const [input, setInput] = useState("mkbhd\nnaval");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handles = useMemo(() => parseCsv(input), [input]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, objective, handles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Leaderboard run failed");
        return;
      }
      setRows(data.rows ?? []);
    } catch {
      setError("Network error while running leaderboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell wide>
      <PageTitle subtitle="Upload or paste handles (CSV/newline), score all, and rank by objective.">
        Batch leaderboard
      </PageTitle>
      <GlassPanel className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Platform</p>
            <PlatformSelector value={platform} onChange={setPlatform} disabled={loading} />
          </div>
          <label className="space-y-2">
            <p className="text-xs text-muted-foreground">Objective</p>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as CompareObjective)}
              className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
            >
              <option value="roi">ROI</option>
              <option value="brand_safety">Brand safety</option>
              <option value="growth">Growth</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button disabled={loading || handles.length === 0} onClick={run} className="w-full">
              {loading ? "Scoring..." : `Run batch (${Math.min(handles.length, 25)})`}
            </Button>
          </div>
        </div>

        <label className="block space-y-2">
          <p className="text-xs text-muted-foreground">Handles (CSV or newline)</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
        </label>
      </GlassPanel>

      {error && (
        <p className="mt-6 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Creator</th>
              <th className="px-4 py-3 text-right">Objective</th>
              <th className="px-4 py-3 text-right">RankMint</th>
              <th className="px-4 py-3 text-right">Success</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.handle}-${i}`} className="border-t border-border">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      name={row.displayName}
                      avatarUrl={row.avatarUrl}
                      avatarGradient={row.avatarGradient}
                      size={40}
                    />
                    <div>
                      <p className="font-medium">{row.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{row.handle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-display">{row.objectiveScore}</td>
                <td className="px-4 py-3 text-right">{row.rankMint}</td>
                <td className="px-4 py-3 text-right">{row.campaignSuccessProbability}%</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No batch results yet. Paste handles and run a leaderboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
