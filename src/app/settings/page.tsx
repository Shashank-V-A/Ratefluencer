import { getAllPlatformStatus } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export const metadata = {
  title: "API Setup — Ratefluencer",
};

export default function SettingsPage() {
  const status = getAllPlatformStatus();

  const sections = [
    {
      id: "youtube",
      name: "YouTube Data API v3",
      status: status.youtube,
      env: ["YOUTUBE_API_KEY"],
      steps: [
        "Open Google Cloud Console → APIs & Services → Library.",
        "Enable **YouTube Data API v3**.",
        "Create an API key (restrict by HTTP referrer in production).",
        "Add `YOUTUBE_API_KEY=...` to `.env.local`.",
      ],
      example: "mkbhd, @MrBeast",
    },
    {
      id: "instagram",
      name: "Instagram Graph API (Business Discovery)",
      status: status.instagram,
      env: ["META_GRAPH_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"],
      steps: [
        "Create a Meta app at developers.facebook.com.",
        "Connect an Instagram **Business** or **Creator** account to a Facebook Page.",
        "Add Instagram Graph API product; request `instagram_basic` and `instagram_manage_insights` (or Business Discovery scope).",
        "Generate a long-lived Page access token with `META_GRAPH_ACCESS_TOKEN`.",
        "Find your IG user ID via Graph API Explorer → `INSTAGRAM_BUSINESS_ACCOUNT_ID`.",
        "Business Discovery returns public metrics for other Business/Creator accounts only.",
      ],
      example: "Any public Business/Creator handle (not personal accounts).",
    },
    {
      id: "x",
      name: "X (Twitter) API v2",
      status: status.x,
      env: ["X_API_BEARER_TOKEN"],
      steps: [
        "Create a project at developer.x.com.",
        "Generate a **Bearer Token** (App-only auth).",
        "Ensure access includes **Read** user tweets (`tweet.read`, `users.read`).",
        "Free tier is limited; Basic tier recommended for tweet history.",
        "Add `X_API_BEARER_TOKEN=...` to `.env.local`.",
      ],
      example: "elonmusk, naval",
    },
  ];

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">Platform API setup</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Ratefluencer pulls real creator metrics from official APIs. Keys stay
          server-side in <code className="text-foreground">.env.local</code> only.
          Copy <code className="text-foreground">.env.example</code> →{" "}
          <code className="text-foreground">.env.local</code>, then follow{" "}
          <code className="text-foreground">docs/API_KEYS.md</code> in the project
          folder (step-by-step for every key).
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section
              key={s.id}
              className="rounded-2xl border border-border/80 bg-card/40 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">{s.name}</h2>
                {s.status.configured ? (
                  <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-amber-400 border-amber-500/30">
                    <XCircle className="h-3 w-3" />
                    Not configured
                  </Badge>
                )}
              </div>

              {!s.status.configured && s.status.missing.length > 0 && (
                <p className="mt-3 text-sm text-amber-200/80">
                  Missing: {s.status.missing.join(", ")}
                </p>
              )}

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Environment variables
                </p>
                <ul className="mt-2 space-y-1 font-mono text-sm">
                  {s.env.map((e) => (
                    <li key={e} className="rounded bg-muted/40 px-3 py-1.5">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                {s.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>

              <p className="mt-4 text-sm">
                <span className="text-muted-foreground">Example handles: </span>
                {s.example}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Restart <code>npm run dev</code> after changing environment variables.
        </p>
      </div>
    </div>
  );
}
