"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type PlatformStatus = { configured: boolean; missing: string[] };

export function ApiStatusBanner() {
  const [status, setStatus] = useState<{
    youtube?: PlatformStatus;
    x?: PlatformStatus;
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
      <div className="flex flex-col gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" />
          <span>
            YouTube + X API keys verified.
          </span>
        </div>
        <p className="pl-6 text-xs text-orange-700/80">
          X free tier: profile lookup works; tweet history may be limited.
        </p>
      </div>
    );
  }

  if (xKeyPresent && xVerify && !xVerify.ok && !xVerify.tokenValid) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="font-medium">X Bearer Token invalid (401)</p>
            <p className="mt-1 text-xs text-red-700">{xVerify.error}</p>
          </div>
        </div>
        {youtubeOk && (
          <p className="pl-6 text-xs text-red-700/80">
            YouTube is working — use YouTube for now.
          </p>
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
    <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>
          Create{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs shadow-sm">
            .env.local
          </code>{" "}
          (run{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs shadow-sm">
            npm run env:setup
          </code>
          ), add <strong>{missing.join(" & ")}</strong> keys, then restart{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs shadow-sm">
            npm run dev
          </code>
          . Not{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs shadow-sm">
            .env.example
          </code>
          .
        </span>
      </div>
    </div>
  );
}
