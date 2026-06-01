import Link from "next/link";
import { GlassPanel, PageShell, PageTitle } from "@/components/ui/page-shell";

export const metadata = {
  title: "How RankMint scores creators — Methodology",
};

export default function MethodologyPage() {
  return (
    <PageShell>
      <PageTitle subtitle="What is live from APIs vs modeled — no marketing fluff.">
        Scoring methodology
      </PageTitle>

      <div className="space-y-6">
        <GlassPanel>
          <h2 className="font-display text-xl">Live data</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Profile, bio, follower counts, and recent posts from YouTube Data API, X API v2, or Instagram Graph API.</li>
            <li>Engagement metrics aggregated from returned posts at analysis time.</li>
            <li>Results cached by platform + handle (default 6h) in Supabase when configured.</li>
          </ul>
        </GlassPanel>

        <GlassPanel>
          <h2 className="font-display text-xl">RankMint™ score</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Trained logistic regression on synthetic micro-UGC campaign labels
            (<code className="rounded bg-white/5 px-1">ml/train_model.py</code>).
            Coefficients are synced to production via{" "}
            <code className="rounded bg-white/5 px-1">npm run ml:sync</code>.
            Model version is shown on every report.
          </p>
        </GlassPanel>

        <GlassPanel>
          <h2 className="font-display text-xl">Brand match (embeddings + RAG)</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            By default, RankMint embeds creator bios and brand briefs with{" "}
            <strong>built-in semantic embeddings</strong> — no OpenAI or other
            third-party AI key required. If you set{" "}
            <code className="rounded bg-white/5 px-1">OPENAI_API_KEY</code>,
            cloud embeddings are used instead (optional upgrade). With Supabase
            configured, top brands are retrieved via pgvector cosine similarity,
            then reranked with commerce signals (save rate, share rate, content
            fit). Manage brands in{" "}
            <Link href="/brands" className="text-primary hover:underline">
              Brand workspace
            </Link>
            .
          </p>
        </GlassPanel>

        <GlassPanel>
          <h2 className="font-display text-xl">Authenticity</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Heuristic risk flags from public metrics (engagement variance, comment
            patterns, follower/following ratio). Not a third-party fraud API — treat
            as signals, not ground truth.
          </p>
        </GlassPanel>

        <GlassPanel>
          <h2 className="font-display text-xl">Audience demographics</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Hidden unless supplied by a platform API with OAuth (Instagram Insights,
            YouTube Analytics). We do not fabricate age/country charts.
          </p>
        </GlassPanel>
      </div>
    </PageShell>
  );
}
