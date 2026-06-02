import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/types";

export function BrandMatchList({
  recommendations,
}: {
  recommendations: AnalysisResult["brandRecommendations"];
}) {
  const seen = new Set<string>();
  const unique = recommendations.filter((rec) => {
    const key = rec.brand.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="space-y-4">
      {unique.map((rec, i) => (
        <div
          key={rec.brand.id}
          className="rounded-xl border border-border/70 bg-muted/20 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{i + 1}</span>
                <h4 className="font-medium">{rec.brand.name}</h4>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {rec.brand.category}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {rec.rationale}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-display text-2xl tabular-nums">{rec.score}</span>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                match
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
