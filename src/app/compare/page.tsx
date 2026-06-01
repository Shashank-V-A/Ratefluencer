"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { creators } from "@/lib/data/creators";
import { analyzeAllCreators } from "@/lib/analyze";
import { ScoreRing } from "@/components/score-ring";
import { formatFollowers } from "@/lib/format";

export default function ComparePage() {
  const analyses = useMemo(() => analyzeAllCreators(), []);
  const [leftId, setLeftId] = useState(analyses[0]?.profile.id ?? "");
  const [rightId, setRightId] = useState(analyses[1]?.profile.id ?? "");

  const left = analyses.find((a) => a.profile.id === leftId);
  const right = analyses.find((a) => a.profile.id === rightId);

  if (!left || !right) return null;

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
        <h1 className="font-display text-3xl font-semibold">Compare creators</h1>
        <p className="mt-3 text-muted-foreground">
          Side-by-side intelligence for partnership decisions — optimized for
          micro UGC, not celebrity reach.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger>
              <SelectValue placeholder="Creator A" />
            </SelectTrigger>
            <SelectContent>
              {creators.map((c) => (
                <SelectItem key={c.id} value={c.id} disabled={c.id === rightId}>
                  {c.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger>
              <SelectValue placeholder="Creator B" />
            </SelectTrigger>
            <SelectContent>
              {creators.map((c) => (
                <SelectItem key={c.id} value={c.id} disabled={c.id === leftId}>
                  {c.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {[left, right].map((a) => (
            <div
              key={a.profile.id}
              className="flex flex-col items-center rounded-2xl border border-border/80 bg-card/40 p-8"
            >
              <ScoreRing score={a.scores.ratefluencer} size={120} />
              <h2 className="mt-4 font-display text-xl font-semibold">
                {a.profile.displayName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {a.profile.nicheLabel}
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
