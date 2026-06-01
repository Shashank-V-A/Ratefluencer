"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type StatusMap = Record<
  string,
  { configured: boolean; missing: string[] }
>;

export function ApiStatusBanner() {
  const [status, setStatus] = useState<StatusMap | null>(null);

  useEffect(() => {
    fetch("/api/platforms/status")
      .then((r) => r.json())
      .then((d) => setStatus(d.platforms))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const configured = Object.values(status).filter((s) => s.configured).length;
  const total = Object.keys(status).length;

  if (configured === total) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        All platform APIs connected — live analysis enabled.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {configured}/{total} APIs configured. Add keys in{" "}
          <code className="rounded bg-black/20 px-1">.env.local</code> for live
          Instagram, YouTube, and X lookups.
        </span>
      </div>
      <Link
        href="/settings"
        className="shrink-0 font-medium text-primary hover:underline"
      >
        Setup guide →
      </Link>
    </div>
  );
}
