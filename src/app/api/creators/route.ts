import { analyzeAllCreators } from "@/lib/analyze";
import { NextResponse } from "next/server";

export async function GET() {
  const results = analyzeAllCreators();
  return NextResponse.json({
    creators: results.map((r) => ({
      id: r.profile.id,
      handle: r.profile.handle,
      displayName: r.profile.displayName,
      niche: r.profile.nicheLabel,
      platform: r.profile.platform,
      followers: r.profile.metrics.followers,
      scores: r.scores,
      avatarGradient: r.profile.avatarGradient,
    })),
  });
}
