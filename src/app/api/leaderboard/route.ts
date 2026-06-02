import { analyzeLiveCreator } from "@/lib/analyze";
import { getSessionId } from "@/lib/session";
import type { CompareObjective, Platform } from "@/lib/types";
import { NextResponse } from "next/server";

function scoreForObjective(
  objective: CompareObjective,
  scores: {
    authenticity: number;
    growthPotential: number;
    brandMatch: number;
    campaignSuccessProbability: number;
    rankMint: number;
  }
) {
  if (objective === "brand_safety") {
    return (
      scores.authenticity * 0.6 +
      scores.growthPotential * 0.15 +
      scores.brandMatch * 0.1 +
      scores.campaignSuccessProbability * 0.15
    );
  }
  if (objective === "growth") {
    return (
      scores.growthPotential * 0.6 +
      scores.authenticity * 0.1 +
      scores.brandMatch * 0.1 +
      scores.campaignSuccessProbability * 0.2
    );
  }
  return (
    scores.campaignSuccessProbability * 0.4 +
    scores.rankMint * 0.2 +
    scores.authenticity * 0.2 +
    scores.brandMatch * 0.2
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const platform = body.platform as Platform;
  const objective = (body.objective as CompareObjective) ?? "roi";
  const handles = Array.isArray(body.handles)
    ? body.handles
        .map((h: unknown) => (typeof h === "string" ? h.replace(/^@/, "").trim() : ""))
        .filter(Boolean)
        .slice(0, 25)
    : [];

  if (!platform || !["youtube", "x", "linkedin"].includes(platform)) {
    return NextResponse.json({ error: "Valid platform is required" }, { status: 400 });
  }
  if (!handles.length) {
    return NextResponse.json({ error: "Provide at least one handle" }, { status: 400 });
  }

  const sessionId = await getSessionId();
  const rows: {
    handle: string;
    displayName: string;
    avatarUrl?: string;
    avatarGradient: string;
    rankMint: number;
    authenticity: number;
    growthPotential: number;
    brandMatch: number;
    campaignSuccessProbability: number;
    objectiveScore: number;
    profileUrl?: string;
  }[] = [];

  for (const handle of handles) {
    try {
      const result = await analyzeLiveCreator(platform, handle, { sessionId });
      rows.push({
        handle: result.profile.handle,
        displayName: result.profile.displayName,
        avatarUrl: result.meta?.avatarUrl,
        avatarGradient: result.profile.avatarGradient,
        rankMint: result.scores.rankMint,
        authenticity: result.scores.authenticity,
        growthPotential: result.scores.growthPotential,
        brandMatch: result.scores.brandMatch,
        campaignSuccessProbability: result.scores.campaignSuccessProbability,
        objectiveScore: Number(scoreForObjective(objective, result.scores).toFixed(2)),
        profileUrl: result.meta?.profileUrl,
      });
    } catch {
      // Skip bad handles; leaderboard should still return partial useful rows.
    }
  }

  rows.sort((a, b) => b.objectiveScore - a.objectiveScore);
  return NextResponse.json({ rows, objective, platform, analyzed: rows.length });
}
