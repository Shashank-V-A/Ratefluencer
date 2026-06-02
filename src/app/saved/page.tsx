"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassPanel, PageShell, PageTitle } from "@/components/ui/page-shell";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { encodeLiveReportId } from "@/lib/report-id";
import type { Platform } from "@/lib/types";

type SavedRow = {
  id: string;
  platform: string;
  handle: string;
  display_name: string;
  rank_mint_score: number;
  created_at: string;
  avatar_url?: string | null;
  avatar_gradient: string;
};

export default function SavedPage() {
  const [reports, setReports] = useState<SavedRow[]>([]);
  const [needsSupabase, setNeedsSupabase] = useState(false);

  async function load() {
    const res = await fetch("/api/reports/saved");
    const data = await res.json();
    setReports(data.reports ?? []);
    setNeedsSupabase(data.supabase === false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/reports/saved?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <PageShell>
      <PageTitle subtitle="Saved creator reports for your session (Supabase-backed).">
        Shortlist
      </PageTitle>

      {needsSupabase && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configure Supabase in <code className="rounded bg-white px-1.5 py-0.5 text-xs shadow-sm">.env.local</code> to
          persist saved reports.
        </p>
      )}

      <div className="space-y-3">
        {reports.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No saved reports yet. Analyze a creator and click Save on the report.
          </p>
        )}
        {reports.map((r) => (
          <GlassPanel
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex min-w-0 items-center gap-4">
              <ProfileAvatar
                name={r.display_name}
                avatarUrl={r.avatar_url ?? undefined}
                avatarGradient={r.avatar_gradient}
                size={52}
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium">{r.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  @{r.handle} · {r.platform} · RankMint {r.rank_mint_score}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/report/${encodeLiveReportId(r.platform as Platform, r.handle)}`}
                className="text-sm text-primary hover:underline"
              >
                Open
              </Link>
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          </GlassPanel>
        ))}
      </div>
    </PageShell>
  );
}
