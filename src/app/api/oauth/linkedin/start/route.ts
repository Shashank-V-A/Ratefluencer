import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getLinkedInOAuthConfig,
  isLinkedInOAuthConfigured,
  setLinkedInOAuthState,
} from "@/lib/linkedin-oauth";

export async function GET() {
  if (!isLinkedInOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "LinkedIn OAuth is not configured",
        hint: "Set LINKEDIN_OAUTH_CLIENT_ID, LINKEDIN_OAUTH_CLIENT_SECRET, LINKEDIN_OAUTH_REDIRECT_URI in .env.local",
      },
      { status: 503 }
    );
  }

  const state = randomUUID();
  await setLinkedInOAuthState(state);
  const cfg = getLinkedInOAuthConfig();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId!,
    redirect_uri: cfg.redirectUri!,
    state,
    scope: "openid profile email",
  });

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
}
