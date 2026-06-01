import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";
import type { AnalysisResult } from "@/lib/types";
import { formatFollowers } from "@/lib/format";

export function CreatorCard({ analysis }: { analysis: AnalysisResult }) {
  const { profile, scores } = analysis;

  return (
    <Link
      href={`/creators/${profile.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/50 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.45)]"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${profile.avatarGradient} opacity-80`}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${profile.avatarGradient} text-sm font-semibold text-foreground/90 shadow-inner`}
          >
            {profile.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h3 className="font-medium leading-tight group-hover:text-primary transition-colors">
              {profile.displayName}
            </h3>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          </div>
        </div>
        <ScoreRing score={scores.ratefluencer} size={72} strokeWidth={5} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge variant="secondary" className="font-normal">
          {profile.nicheLabel}
        </Badge>
        <Badge variant="outline" className="font-normal capitalize">
          {profile.platform}
        </Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-5 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Authenticity</p>
          <p className="font-display text-lg tabular-nums">{scores.authenticity}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Growth</p>
          <p className="font-display text-lg tabular-nums">{scores.growthPotential}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Followers</p>
          <p className="font-display text-lg tabular-nums">
            {formatFollowers(profile.metrics.followers)}
          </p>
        </div>
      </div>
    </Link>
  );
}
