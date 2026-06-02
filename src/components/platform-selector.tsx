"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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

const ALL_PLATFORMS: {
  id: Platform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  envKey: "youtube" | "x" | "linkedin";
}[] = [
  { id: "youtube", label: "YouTube", icon: YoutubeIcon, envKey: "youtube" },
  { id: "x", label: "X", icon: XIcon, envKey: "x" },
  { id: "linkedin", label: "LinkedIn", icon: LinkedInIcon, envKey: "linkedin" },
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
          linkedin: p.linkedin?.configured ?? false,
        });
      })
      .catch(() =>
        setConfigured({ youtube: false, x: false, linkedin: false })
      );
  }, []);

  const visible = ALL_PLATFORMS.filter((p) => configured[p.envKey]);

  useEffect(() => {
    if (visible.length && !visible.some((p) => p.id === value)) {
      onChange(visible[0]!.id);
    }
  }, [visible, value, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((p) => {
          const selected = value === p.id;
          const isConfigured = configured[p.envKey];

          return (
            <button
              key={p.id}
              type="button"
              suppressHydrationWarning
              disabled={disabled || !isConfigured}
              onClick={() => onChange(p.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                selected
                  ? "border-primary/40 bg-accent text-primary shadow-sm"
                  : "border-border bg-white text-muted-foreground hover:border-primary/25 hover:bg-muted/60 hover:text-foreground",
                (disabled || !isConfigured) &&
                  "cursor-not-allowed opacity-45"
              )}
            >
              <p.icon className="h-4 w-4" />
              {p.label}
            </button>
          );
        })}
      </div>
      {!configured.linkedin && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          LinkedIn appears when OAuth credentials are in{" "}
          <code className="text-xs">.env.local</code>. Sign in on the home page to analyze
          your profile; other creators need LinkedIn partner API access.
        </p>
      )}
    </div>
  );
}
