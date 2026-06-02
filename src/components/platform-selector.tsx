"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const PLATFORMS: {
  id: Platform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  envKey: "youtube" | "x";
}[] = [
  { id: "youtube", label: "YouTube", icon: YoutubeIcon, envKey: "youtube" },
  { id: "x", label: "X", icon: XIcon, envKey: "x" },
];

export function PlatformSelector({
  value,
  onChange,
  disabled,
}: {
  value: Platform;
  onChange: (p: Platform) => void;
  disabled?: boolean;
}) {
  const [configured, setConfigured] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/platforms/status")
      .then((r) => r.json())
      .then((d) => {
        const p = d.platforms as Record<string, { configured: boolean }>;
        setConfigured({
          youtube: p.youtube?.configured ?? false,
          x: p.x?.configured ?? false,
        });
      })
      .catch(() => setConfigured({ youtube: false, x: false }));
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const selected = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            suppressHydrationWarning
            disabled={disabled || !configured[p.envKey]}
            onClick={() => onChange(p.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
              selected
                ? "border-primary/40 bg-accent text-primary shadow-sm"
                : "border-border bg-white text-muted-foreground hover:border-primary/25 hover:bg-muted/60 hover:text-foreground",
              (disabled || !configured[p.envKey]) &&
                "cursor-not-allowed opacity-45"
            )}
          >
            <p.icon className="h-4 w-4" />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
