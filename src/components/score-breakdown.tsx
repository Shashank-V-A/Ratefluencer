"use client";

import { Progress } from "@/components/ui/progress";
import { scorePercent } from "@/lib/ml/safe-number";
import type { AnalysisResult, ScoreBreakdown as Scores } from "@/lib/types";

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

function getExplainer(
  explainability: AnalysisResult["explainability"] | undefined,
  key: keyof Scores
) {
  if (!explainability) return undefined;
  if (key === "authenticity") return explainability.authenticity;
  if (key === "growthPotential") return explainability.growthPotential;
  if (key === "brandMatch") return explainability.brandMatch;
  if (key === "campaignSuccessProbability") {
    return explainability.campaignSuccessProbability;
  }
  return undefined;
}

export function ScoreBreakdownPanel({
  scores,
  explainability,
  freshnessMinutes,
}: {
  scores: Scores;
  explainability?: AnalysisResult["explainability"];
  freshnessMinutes?: number;
}) {
  return (
    <div className="space-y-5">
      {typeof freshnessMinutes === "number" && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Data freshness: {freshnessMinutes <= 1 ? "just now" : `${freshnessMinutes} min ago`}
        </p>
      )}
      {items.map((item) => {
        const raw =
          item.key === "campaignSuccessProbability"
            ? scores.campaignSuccessProbability
            : scores[item.key];
        const value = scorePercent(raw);
        const asPercent = item.key === "campaignSuccessProbability";
        const explainer = getExplainer(explainability, item.key);
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
            {explainer && (
              <details className="rounded-lg border border-border/80 bg-card/60 px-3 py-2 text-xs">
                <summary className="cursor-pointer font-medium text-primary">
                  Why this score?
                </summary>
                <p className="mt-2 text-muted-foreground">{explainer.summary}</p>
                <p className="mt-2 text-muted-foreground">
                  Confidence {explainer.confidence}% · Sample size {explainer.sampleSize}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                  {explainer.positives.slice(0, 2).map((line, idx) => (
                    <li key={`pos-${item.key}-${idx}-${line.slice(0, 24)}`}>+ {line}</li>
                  ))}
                  {explainer.negatives.slice(0, 2).map((line, idx) => (
                    <li key={`neg-${item.key}-${idx}-${line.slice(0, 24)}`}>- {line}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
