import {
  getAllPlatformStatus,
  getCorePlatformStatus,
  getOpenAIStatus,
  getSupabaseStatus,
} from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  const platforms = getAllPlatformStatus();
  const core = getCorePlatformStatus();
  return NextResponse.json({
    platforms,
    coreReady: core.youtube.configured && core.x.configured,
    instagramOptional: !platforms.instagram.configured,
    openai: { ...getOpenAIStatus(), note: "Optional — brand match works without it" },
    supabase: getSupabaseStatus(),
    docs: "docs/API_KEYS.md",
  });
}
