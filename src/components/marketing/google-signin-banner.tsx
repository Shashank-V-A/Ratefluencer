"use client";

import { useEffect, useState } from "react";

export function GoogleSigninBanner() {
  const [oauth, setOauth] = useState<{
    configured: boolean;
    connected: boolean;
  }>({ configured: false, connected: false });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/oauth/youtube/status")
      .then((r) => r.json())
      .then((d) =>
        setOauth({
          configured: Boolean(d.configured),
          connected: Boolean(d.connected),
        })
      )
      .catch(() =>
        setOauth({
          configured: false,
          connected: false,
        })
      );

    const status = new URLSearchParams(window.location.search).get(
      "youtube_oauth"
    );
    if (!status) return;
    if (status === "connected") {
      setMessage("Google connected. YouTube demographics API is now active.");
      setOauth((prev) => ({ ...prev, connected: true }));
    } else {
      setMessage(`Google sign-in status: ${status.replaceAll("_", " ")}`);
    }
  }, []);

  if (!oauth.configured) return null;

  return (
    <section className="px-6 pt-8 md:pt-10">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-white/85 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              YouTube demographics via Google sign-in
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {oauth.connected
                ? "Connected: audience demographics use YouTube Analytics API where available."
                : "Connect once with Google to enable API demographics across reports."}
            </p>
            {message && (
              <p className="mt-1 text-xs text-primary">{message}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!oauth.connected ? (
              <a
                href="/api/oauth/youtube/start"
                className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                Sign in with Google
              </a>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/oauth/youtube/disconnect", { method: "POST" });
                  setOauth((prev) => ({ ...prev, connected: false }));
                  setMessage("Disconnected Google account.");
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
