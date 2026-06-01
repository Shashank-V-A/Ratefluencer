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
  const [xVerify, setXVerify] = useState<{
    ok: boolean;
    tokenValid?: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/platforms/status")
      .then((r) => r.json())
      .then((d) => setStatus(d.platforms))
      .catch(() => setStatus(null));
    fetch("/api/platforms/verify-x")
      .then((r) => r.json())
      .then((d) => setXVerify(d))
      .catch(() => setXVerify(null));
  }, []);

  if (!status) return null;

  const youtubeOk = status.youtube?.configured;
  const xKeyPresent = status.x?.configured;
  const xOk = xKeyPresent && xVerify?.ok === true;
  const coreReady = youtubeOk && xOk;

  if (coreReady) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            YouTube + X API keys verified. Instagram is optional.
          </span>
        </div>
        <p className="text-xs text-emerald-400/80 pl-6">
          X free tier: profile lookup works; tweet history may be limited.
        </p>
      </div>
    );
  }

  if (xKeyPresent && xVerify && !xVerify.ok && !xVerify.tokenValid) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-300">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">X Bearer Token invalid (401)</p>
            <p className="mt-1 text-xs opacity-90">{xVerify.error}</p>
          </div>
        </div>
        {youtubeOk && (
          <p className="text-xs pl-6 opacity-80">YouTube is working — use YouTube for now.</p>
        )}
      </div>
    );
  }

  const missing: string[] = [];
  if (!youtubeOk) missing.push("YouTube");
  const xNeedsSetup =
    !xKeyPresent ||
    (xVerify !== null && !xVerify.ok && !xVerify.tokenValid);
  if (xNeedsSetup) missing.push("X");

  if (missing.length === 0) return null;

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
