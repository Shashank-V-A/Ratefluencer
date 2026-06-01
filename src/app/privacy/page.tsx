export const metadata = { title: "Privacy Policy — Ratefluencer" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 prose prose-invert prose-sm">
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Privacy Policy
      </h1>
      <p className="text-muted-foreground">Last updated: June 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Ratefluencer analyzes public social media profiles when a user
          submits a handle. We do not sell personal data.
        </p>
        <p>
          Data from third-party APIs (X, YouTube, Instagram) is used only to
          display analytics in this application and is not redistributed.
        </p>
        <p>
          API keys are stored server-side. Contact the operator for data
          requests or deletion.
        </p>
      </div>
    </div>
  );
}
