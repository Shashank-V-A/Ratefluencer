import { getAllPlatformStatus, getCorePlatformStatus } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  const platforms = getAllPlatformStatus();
  const core = getCorePlatformStatus();
  return NextResponse.json({
    platforms,
    coreReady: core.youtube.configured && core.x.configured,
    instagramOptional: !platforms.instagram.configured,
    docs: "/settings",
  });
}
