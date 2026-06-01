import {
  analyzeCreatorByHandle,
  analyzeLiveCreator,
} from "@/lib/analyze";
import { getAllPlatformStatus } from "@/lib/env";
import { PlatformApiError } from "@/lib/platforms";
import type { Platform } from "@/lib/types";
import { NextResponse } from "next/server";

const PLATFORMS: Platform[] = ["instagram", "youtube", "x", "tiktok"];

function parsePlatform(value: unknown): Platform | null {
  if (typeof value !== "string") return null;
  const p = value.toLowerCase() as Platform;
  return PLATFORMS.includes(p) ? p : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const handle =
    typeof body.handle === "string" ? body.handle.trim().replace(/^@/, "") : "";
  const platform = parsePlatform(body.platform);
  const source =
    body.source === "demo" ? "demo" : body.source === "live" ? "live" : "auto";

  if (!handle) {
    return NextResponse.json(
      { error: "Handle is required" },
      { status: 400 }
    );
  }

  if (source === "demo" || (!platform && source === "auto")) {
    const demo = analyzeCreatorByHandle(handle, platform ?? undefined);
    if (demo) return NextResponse.json(demo);
    if (source === "demo") {
      return NextResponse.json(
        {
          error: "Creator not in demo dataset",
          hint: "Try: priya.glowdiaries — or set source: 'live' with a platform.",
        },
        { status: 404 }
      );
    }
  }

  if (!platform) {
    return NextResponse.json(
      {
        error: "Platform is required for live API lookup",
        hint: "Send { platform: 'instagram' | 'youtube' | 'x', handle: 'username' }",
        platforms: getAllPlatformStatus(),
      },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeLiveCreator(platform, handle);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof PlatformApiError) {
      const demo = analyzeCreatorByHandle(handle, platform);
      if (demo && e.code === "NOT_CONFIGURED") {
        return NextResponse.json(
          {
            ...demo,
            warning:
              "Live API not configured — showing demo profile for this handle if available.",
          },
          { status: 200 }
        );
      }
      const envHint =
        e.code === "NOT_CONFIGURED"
          ? "Create .env.local in the project root (copy .env.example), add your API keys, then restart npm run dev."
          : e.hint;
      return NextResponse.json(
        {
          error: e.message,
          code: e.code,
          hint: envHint,
          platforms: getAllPlatformStatus(),
        },
        { status: e.status ?? 502 }
      );
    }
    console.error("[analyze]", e);
    return NextResponse.json(
      { error: "Analysis failed unexpectedly" },
      { status: 500 }
    );
  }
}
