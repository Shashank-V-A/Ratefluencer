import { NextResponse } from "next/server";
import {
  consumeLinkedInOAuthState,
  fetchLinkedInProfileMeta,
  getLinkedInOAuthConfig,
  isLinkedInOAuthConfigured,
  setLinkedInOAuthSession,
} from "@/lib/linkedin-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${url.origin}/?linkedin_oauth=error&reason=${encodeURIComponent(error)}`
    );
  }
  if (!isLinkedInOAuthConfigured()) {
    return NextResponse.redirect(`${url.origin}/?linkedin_oauth=missing_config`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${url.origin}/?linkedin_oauth=missing_code`);
  }

  const expectedState = await consumeLinkedInOAuthState();
  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(`${url.origin}/?linkedin_oauth=bad_state`);
  }

  const cfg = getLinkedInOAuthConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri!,
    client_id: cfg.clientId!,
    client_secret: cfg.clientSecret!,
  });

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${url.origin}/?linkedin_oauth=token_failed`);
  }

  const token = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!token.access_token) {
    return NextResponse.redirect(`${url.origin}/?linkedin_oauth=token_missing`);
  }

  const profile = await fetchLinkedInProfileMeta(token.access_token);

  await setLinkedInOAuthSession({
    accessToken: token.access_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    scope: token.scope,
    vanityName: profile.vanityName,
    displayName: profile.displayName,
  });

  return NextResponse.redirect(`${url.origin}/?linkedin_oauth=connected`);
}
