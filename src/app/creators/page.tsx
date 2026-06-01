import { analyzeAllCreators } from "@/lib/analyze";
import { CreatorCard } from "@/components/creator-card";

export const metadata = {
  title: "Creator Rankings — Ratefluencer",
};

export default function CreatorsPage() {
  const ranked = analyzeAllCreators();

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Micro creator rankings
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Sorted by Ratefluencer Score™ — an ML ensemble predicting campaign
            success from engagement quality, authenticity, growth, and commerce
            fit. Vanity follower counts are deliberately de-emphasized.
          </p>
        </header>

        <ol className="mt-12 space-y-6">
          {ranked.map((analysis, index) => (
            <li key={analysis.profile.id} className="relative">
              <span className="font-display absolute -left-2 top-8 z-10 hidden text-5xl font-bold tabular-nums text-muted/30 md:-left-12 md:block">
                {String(index + 1).padStart(2, "0")}
              </span>
              <CreatorCard analysis={analysis} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
