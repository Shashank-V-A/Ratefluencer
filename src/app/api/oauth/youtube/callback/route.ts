import { NextResponse } from "next/server";
import {
  consumeYouTubeOAuthState,
  getYouTubeOAuthConfig,
  isYouTubeOAuthConfigured,
  setYouTubeOAuthSession,
} from "@/lib/youtube-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${url.origin}/?youtube_oauth=error&reason=${encodeURIComponent(error)}`
    );
  }
  if (!isYouTubeOAuthConfigured()) {
    return NextResponse.redirect(`${url.origin}/?youtube_oauth=missing_config`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${url.origin}/?youtube_oauth=missing_code`);
  }

  const expectedState = await consumeYouTubeOAuthState();
  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(`${url.origin}/?youtube_oauth=bad_state`);
  }

  const cfg = getYouTubeOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId!,
    client_secret: cfg.clientSecret!,
    redirect_uri: cfg.redirectUri!,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${url.origin}/?youtube_oauth=token_failed`);
  }

  const token = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!token.access_token) {
    return NextResponse.redirect(`${url.origin}/?youtube_oauth=token_missing`);
  }

  await setYouTubeOAuthSession({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    scope: token.scope,
  });

  return NextResponse.redirect(`${url.origin}/?youtube_oauth=connected`);
}
