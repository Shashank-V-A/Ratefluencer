import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getYouTubeOAuthConfig,
  isYouTubeOAuthConfigured,
  setYouTubeOAuthState,
} from "@/lib/youtube-oauth";

export async function GET() {
  if (!isYouTubeOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "YouTube OAuth is not configured",
        hint: "Set YOUTUBE_OAUTH_CLIENT_ID, YOUTUBE_OAUTH_CLIENT_SECRET, YOUTUBE_OAUTH_REDIRECT_URI in .env.local",
      },
      { status: 503 }
    );
  }

  const state = randomUUID();
  await setYouTubeOAuthState(state);
  const cfg = getYouTubeOAuthConfig();

  const params = new URLSearchParams({
    client_id: cfg.clientId!,
    redirect_uri: cfg.redirectUri!,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: [
      "https://www.googleapis.com/auth/yt-analytics.readonly",
      "https://www.googleapis.com/auth/youtube.readonly",
    ].join(" "),
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
