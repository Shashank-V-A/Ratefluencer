"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AudienceDemographics } from "@/lib/types";

function sourceLabel(source: AudienceDemographics["source"]) {
  switch (source) {
    case "api":
      return "Platform API";
    case "inferred":
      return "Inferred from public signals";
    default:
      return "Unavailable";
  }
}

function DemographicBars({
  items,
}: {
  items: { label: string; percent: number }[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="tabular-nums text-foreground">{item.percent}%</span>
          </div>
          <Progress value={item.percent} className="h-1.5" />
        </li>
      ))}
    </ul>
  );
}

export function DemographicsPanel({
  demographics,
}: {
  demographics: AudienceDemographics;
}) {
  if (demographics.source === "unavailable") {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/40 p-6">
        <h2 className="font-display text-lg font-semibold">Audience demographics</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Connect Instagram Insights or YouTube Analytics OAuth for verified audience
          breakdowns. Public analysis does not include platform-held age/country data.
        </p>
      </div>
    );
  }

  const ageItems =
    demographics.ageGroups?.map((g) => ({
      label: g.range,
      percent: g.percent,
    })) ?? [];

  const countryItems =
    demographics.topCountries?.map((c) => ({
      label: c.country,
      percent: c.percent,
    })) ?? [];

  const gender = demographics.genderSplit;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Audience demographics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Age, geography, and gender estimates used in ML feature extraction.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          {sourceLabel(demographics.source)}
        </Badge>
      </div>

      {demographics.source === "inferred" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Derived from creator location, content niche, and platform benchmarks — not
          verified Insights API data.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium">Age distribution</h3>
          <div className="mt-4">
            <DemographicBars items={ageItems} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium">Top countries</h3>
          <div className="mt-4">
            <DemographicBars items={countryItems} />
          </div>
        </div>
      </div>

      {gender && (
        <div className="mt-8">
          <h3 className="text-sm font-medium">Gender split (estimated)</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Female", value: gender.female },
              { label: "Male", value: gender.male },
              { label: "Other / unspecified", value: gender.other },
            ].map((g) => (
              <div
                key={g.label}
                className="rounded-lg border border-primary/12 bg-primary/[0.04] px-4 py-3"
              >
                <p className="text-xs text-muted-foreground">{g.label}</p>
                <p className="font-display mt-1 text-xl tabular-nums">{g.value}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {demographics.purchaseIntent && (
        <p className="mt-6 text-xs text-muted-foreground">
          Purchase intent signal:{" "}
          <span className="capitalize text-foreground">
            {demographics.purchaseIntent}
          </span>{" "}
          (from save rate & engagement vs followers)
        </p>
      )}
    </div>
  );
}
