export const metadata = { title: "Terms of Service — RankMint" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          RankMint is provided for influencer research and education. You
          must comply with X, YouTube, and Meta platform terms when using this
          tool.
        </p>
        <p>
          Do not misuse API data, resell analytics, or automate actions that
          violate provider policies.
        </p>
        <p>The service is provided as-is without warranty.</p>
      </div>
    </div>
  );
}
