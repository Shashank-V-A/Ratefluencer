"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { encodeLiveReportId } from "@/lib/report-id";
import { Bookmark, Download, Link2 } from "lucide-react";

export function ReportActions({ analysis }: { analysis: AnalysisResult }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const reportId = encodeLiveReportId(
    analysis.profile.platform,
    analysis.profile.handle
  );
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/report/${reportId}`
      : `/report/${reportId}`;

  async function saveReport() {
    setSaving(true);
    try {
      const res = await fetch("/api/reports/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button variant="outline" size="sm" onClick={copyLink}>
        <Link2 className="h-4 w-4" />
        {copied ? "Copied" : "Copy share link"}
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/report/${reportId}/export`} download>
          <Download className="h-4 w-4" />
          Export PDF
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={saveReport}
        disabled={saved || saving}
      >
        <Bookmark className="h-4 w-4" />
        {saved ? "Saved" : saving ? "Saving…" : "Save to shortlist"}
      </Button>
    </div>
  );
}
