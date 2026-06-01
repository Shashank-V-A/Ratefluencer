"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type PlatformStatus = { configured: boolean; missing: string[] };

export function ApiStatusBanner() {
  const [status, setStatus] = useState<{
    youtube?: PlatformStatus;
    x?: PlatformStatus;
    instagram?: PlatformStatus;
  } | null>(null);

  useEffect(() => {
    fetch("/api/platforms/status")
      .then((r) => r.json())
      .then((d) => setStatus(d.platforms))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const youtubeOk = status.youtube?.configured;
  const xOk = status.x?.configured;
  const coreReady = youtubeOk && xOk;

  if (coreReady) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            YouTube + X connected. Instagram is optional — leave those env vars
            blank until you have Meta setup.
          </span>
        </div>
        {!status.instagram?.configured && (
          <p className="text-xs text-emerald-400/80 pl-6">
            X free tier: profile analysis works; tweet timelines may be limited
            (pay-as-you-go). Scores show a warning when only profile data is
            used.
          </p>
        )}
      </div>
    );
  }

  const missing: string[] = [];
  if (!youtubeOk) missing.push("YouTube");
  if (!xOk) missing.push("X");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Create <code className="rounded bg-black/20 px-1">.env.local</code>{" "}
          (run <code className="rounded bg-black/20 px-1">npm run env:setup</code>
          ), add <strong>{missing.join(" & ")}</strong> keys, then restart{" "}
          <code className="rounded bg-black/20 px-1">npm run dev</code>. Not{" "}
          <code className="rounded bg-black/20 px-1">.env.example</code>.
        </span>
      </div>
    </div>
  );
}
