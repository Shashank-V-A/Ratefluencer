import { Badge } from "@/components/ui/badge";
import type { AuthenticityFlags } from "@/lib/types";
import { cn } from "@/lib/utils";

const flagLabels: Record<keyof AuthenticityFlags, string> = {
  purchasedFollowers: "Purchased followers",
  engagementPods: "Engagement pods",
  botActivity: "Bot activity",
  artificialSpikes: "Artificial spikes",
};

function riskBadge(level: "low" | "medium" | "high") {
  const styles = {
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    high: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", styles[level])}>
      {level}
    </Badge>
  );
}

export function AuthenticityPanel({
  score,
  flags,
}: {
  score: number;
  flags: AuthenticityFlags;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/40 p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg">Authenticity detection</h3>
        <span className="font-display text-2xl tabular-nums text-score-high">
          {score}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Heuristic risk flags from public post metrics — not a third-party fraud API.
      </p>
      <ul className="mt-6 space-y-3">
        {(Object.keys(flags) as (keyof AuthenticityFlags)[]).map((key) => (
          <li
            key={key}
            className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
          >
            <span className="text-sm">{flagLabels[key]}</span>
            {riskBadge(flags[key])}
          </li>
        ))}
      </ul>
    </div>
  );
}
