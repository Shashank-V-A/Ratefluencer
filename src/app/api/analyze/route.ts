import { analyzeLiveCreator } from "@/lib/analyze";
import { getAllPlatformStatus } from "@/lib/env";
import { PlatformApiError } from "@/lib/platforms";
import { getSessionId } from "@/lib/session";
import type { Platform } from "@/lib/types";
import { NextResponse } from "next/server";

const PLATFORMS: Platform[] = ["youtube", "x"];

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
  const skipCache = body.skipCache === true;
  const brandIds = Array.isArray(body.brandIds)
    ? body.brandIds.filter((id: unknown) => typeof id === "string" && id.trim())
    : undefined;
  const brandWeights =
    body.brandWeights &&
    typeof body.brandWeights === "object" &&
    typeof body.brandWeights.nicheFit === "number" &&
    typeof body.brandWeights.geographyFit === "number" &&
    typeof body.brandWeights.engagementQuality === "number"
      ? {
          nicheFit: body.brandWeights.nicheFit,
          geographyFit: body.brandWeights.geographyFit,
          engagementQuality: body.brandWeights.engagementQuality,
        }
      : undefined;

  if (!handle) {
    return NextResponse.json(
      { error: "Handle is required" },
      { status: 400 }
    );
  }

  if (!platform) {
    return NextResponse.json(
      {
        error: "Platform is required",
        hint: "Send { platform: 'youtube' | 'x', handle: 'username' }",
        platforms: getAllPlatformStatus(),
      },
      { status: 400 }
    );
  }

  try {
    const sessionId = await getSessionId();
    const result = await analyzeLiveCreator(platform, handle, {
      sessionId,
      skipCache,
      brandIds,
      brandWeights,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof PlatformApiError) {
      const envHint =
        e.code === "NOT_CONFIGURED"
          ? "Add API keys to .env.local and restart npm run dev."
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
