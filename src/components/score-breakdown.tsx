"use client";

import { Progress } from "@/components/ui/progress";
import type { ScoreBreakdown as Scores } from "@/lib/types";

const items: { key: keyof Scores; label: string; desc: string }[] = [
  {
    key: "authenticity",
    label: "Authenticity",
    desc: "Real audience, low bot & pod risk",
  },
  {
    key: "growthPotential",
    label: "Growth Potential",
    desc: "90-day follower & engagement forecast",
  },
  {
    key: "brandMatch",
    label: "Brand Match",
    desc: "NLP embedding + RAG retrieval fit",
  },
  {
    key: "campaignSuccessProbability",
    label: "Campaign Success",
    desc: "ML-predicted conversion likelihood",
  },
];

export function ScoreBreakdownPanel({ scores }: { scores: Scores }) {
  return (
    <div className="space-y-5">
      {items.map((item) => {
        const value =
          item.key === "campaignSuccessProbability"
            ? scores.campaignSuccessProbability
            : scores[item.key];
        return (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <span className="font-display text-xl tabular-nums">
                {typeof value === "number" && item.key === "campaignSuccessProbability"
                  ? `${value}%`
                  : value}
              </span>
            </div>
            <Progress value={value} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}
