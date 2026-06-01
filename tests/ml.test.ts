import { describe, expect, it } from "vitest";
import { computeRankMintScore } from "@/lib/ml/rank-mint";
import { inferSignals } from "@/lib/signals/infer";
import type { FetchedCreatorRaw } from "@/lib/platforms/types";

const raw: FetchedCreatorRaw = {
  platform: "youtube",
  handle: "test",
  displayName: "Test Creator",
  bio: "ugc haul skincare",
  location: "US",
  profileUrl: "https://youtube.com/@test",
  followers: 25_000,
  following: 100,
  mediaCount: 50,
  media: [
    {
      id: "1",
      caption: "haul",
      likes: 1200,
      comments: 80,
      views: 15000,
      shares: 40,
      saves: 200,
      timestamp: new Date().toISOString(),
      mediaType: "video",
    },
  ],
};

describe("inferSignals", () => {
  it("returns bounded signal scores", () => {
    const signals = inferSignals(raw, {
      totalLikes: 1200,
      totalComments: 80,
      totalShares: 40,
      totalSaves: 200,
      totalViews: 15000,
      postsLast30: 8,
      postsLast90: 20,
      avgViews: 15000,
    });
    expect(signals.ghostFollowerEstimate).toBeGreaterThanOrEqual(0);
    expect(signals.ghostFollowerEstimate).toBeLessThanOrEqual(1);
    expect(signals.podActivityScore).toBeLessThanOrEqual(1);
  });
});

describe("computeRankMintScore", () => {
  it("returns score between 0 and 100", () => {
    const profile = {
      id: "youtube-test",
      handle: "test",
      displayName: "Test",
      platform: "youtube" as const,
      bio: "haul",
      location: "US",
      avatarGradient: "from-a to-b",
      metrics: {
        followers: 25000,
        following: 100,
        likes: 1200,
        comments: 80,
        shares: 40,
        saves: 200,
        views: 15000,
        postsLast30Days: 8,
        postsLast90Days: 20,
        avgReelViews: 15000,
        avgReelDurationSec: 30,
      },
      demographics: { source: "unavailable" as const },
      signals: inferSignals(raw, {
        totalLikes: 1200,
        totalComments: 80,
        totalShares: 40,
        totalSaves: 200,
        totalViews: 15000,
        postsLast30: 8,
        postsLast90: 20,
        avgViews: 15000,
      }),
      pastCampaigns: 0,
      campaignSuccessRate: 0.6,
    };
    const { score, featureImportance } = computeRankMintScore(profile);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(featureImportance.length).toBeGreaterThan(0);
  });
});
