import { NextResponse } from "next/server";
import { getYouTubeOAuthSession, isYouTubeOAuthConfigured } from "@/lib/youtube-oauth";

export async function GET() {
  const session = await getYouTubeOAuthSession();
  return NextResponse.json({
    configured: isYouTubeOAuthConfigured(),
    connected: Boolean(session?.accessToken),
    expiresAt: session?.expiresAt,
    hasRefreshToken: Boolean(session?.refreshToken),
  });
}
