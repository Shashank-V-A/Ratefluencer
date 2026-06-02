import { NextResponse } from "next/server";
import {
  getLinkedInOAuthSession,
  isLinkedInOAuthConfigured,
} from "@/lib/linkedin-oauth";

export async function GET() {
  const session = await getLinkedInOAuthSession();
  return NextResponse.json({
    configured: isLinkedInOAuthConfigured(),
    connected: Boolean(session?.accessToken),
    vanityName: session?.vanityName ?? null,
    displayName: session?.displayName ?? null,
  });
}
