"use client";

import { Progress } from "@/components/ui/progress";
import { scorePercent } from "@/lib/ml/safe-number";
import type { ScoreBreakdown as Scores } from "@/lib/types";

function displayScore(value: number, asPercent: boolean): string {
  const n = scorePercent(value);
  return asPercent ? `${n}%` : String(n);
}

const items: { key: keyof Scores; label: string; desc: string }[] = [
  {
    key: "authenticity",
    label: "Authenticity",
    desc: "Heuristic risk from public metrics (not a fraud vendor)",
  },
  {
    key: "growthPotential",
    label: "Growth Potential",
    desc: "Modeled 90-day forecast — not platform analytics API",
  },
  {
    key: "brandMatch",
    label: "Brand Match",
    desc: "Embedding similarity vs your brand catalog",
  },
  {
    key: "campaignSuccessProbability",
    label: "Campaign Success",
    desc: "Trained model estimate — add real labels in ml/campaign_labels.csv",
  },
];

export function ScoreBreakdownPanel({ scores }: { scores: Scores }) {
  return (
    <div className="space-y-5">
      {items.map((item) => {
        const raw =
          item.key === "campaignSuccessProbability"
            ? scores.campaignSuccessProbability
            : scores[item.key];
        const value = scorePercent(raw);
        const asPercent = item.key === "campaignSuccessProbability";
        return (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className="font-display text-xl tabular-nums">
                {displayScore(raw, asPercent)}
              </span>
            </div>
            <Progress value={value} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}
