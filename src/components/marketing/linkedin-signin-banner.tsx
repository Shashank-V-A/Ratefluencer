"use client";

import { useEffect, useState } from "react";

export function LinkedInSigninBanner() {
  const [oauth, setOauth] = useState<{
    configured: boolean;
    connected: boolean;
    vanityName: string | null;
  }>({ configured: false, connected: false, vanityName: null });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/oauth/linkedin/status")
      .then((r) => r.json())
      .then((d) =>
        setOauth({
          configured: Boolean(d.configured),
          connected: Boolean(d.connected),
          vanityName: d.vanityName ?? null,
        })
      )
      .catch(() =>
        setOauth({ configured: false, connected: false, vanityName: null })
      );

    const status = new URLSearchParams(window.location.search).get(
      "linkedin_oauth"
    );
    if (!status) return;
    if (status === "connected") {
      setMessage("LinkedIn connected. You can analyze your own profile on the Analyze page.");
      setOauth((prev) => ({ ...prev, connected: true }));
    } else {
      setMessage(`LinkedIn sign-in status: ${status.replaceAll("_", " ")}`);
    }
  }, []);

  if (!oauth.configured) return null;

  return (
    <section className="px-6 pt-4 md:pt-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-white/85 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              LinkedIn creator analysis
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {oauth.connected
                ? oauth.vanityName
                  ? `Connected as ${oauth.vanityName}. Analyze your handle or linkedin.com/in/${oauth.vanityName} on the Analyze page.`
                  : "Connected. Analyze your own LinkedIn profile on the Analyze page."
                : "Connect with LinkedIn to analyze your own profile. Other creators require LinkedIn partner API access."}
            </p>
            {message && (
              <p className="mt-1 text-xs text-primary">{message}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!oauth.connected ? (
              <a
                href="/api/oauth/linkedin/start"
                className="inline-flex rounded-full border border-[#0A66C2]/30 bg-[#0A66C2]/10 px-4 py-2 text-sm font-medium text-[#0A66C2]"
              >
                Sign in with LinkedIn
              </a>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/oauth/linkedin/disconnect", { method: "POST" });
                  setOauth((prev) => ({
                    ...prev,
                    connected: false,
                    vanityName: null,
                  }));
                  setMessage("Disconnected LinkedIn account.");
                }}
                className="inline-flex rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
