import { describe, expect, it } from "vitest";
import {
  applyScaleCalibration,
  authenticityScaleFactor,
  getCreatorTier,
} from "@/lib/ml/creator-tier";
import { scorePercent } from "@/lib/ml/safe-number";
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

describe("safe-number", () => {
  it("coerces NaN scores to 0 for UI", () => {
    expect(scorePercent(NaN)).toBe(0);
    expect(scorePercent(Infinity)).toBe(0);
  });
});

describe("creator tier calibration", () => {
  it("dampens purchased-follower signals at mega scale", () => {
    expect(authenticityScaleFactor(6_000_000)).toBeLessThan(0.5);
    expect(authenticityScaleFactor(25_000)).toBe(1);
  });

  it("caps mega creator RankMint", () => {
    const profile = {
      id: "youtube-mega",
      handle: "mega",
      displayName: "Mega",
      platform: "youtube" as const,
      bio: "tech",
      location: "US",
      avatarGradient: "from-a to-b",
      metrics: {
        followers: 20_000_000,
        following: 100,
        likes: 500_000,
        comments: 50_000,
        shares: 10_000,
        saves: 20_000,
        views: 5_000_000,
        postsLast30Days: 12,
        postsLast90Days: 40,
        avgReelViews: 5_000_000,
        avgReelDurationSec: 600,
      },
      demographics: { source: "unavailable" as const },
      signals: inferSignals(
        { ...raw, followers: 20_000_000 },
        {
          totalLikes: 500_000,
          totalComments: 50_000,
          totalShares: 10_000,
          totalSaves: 20_000,
          totalViews: 5_000_000,
          postsLast30: 12,
          postsLast90: 40,
          avgViews: 5_000_000,
        }
      ),
      pastCampaigns: 0,
      campaignSuccessRate: 0.6,
    };
    expect(getCreatorTier(profile.metrics.followers)).toBe("mega");
    const rankResult = computeRankMintScore(profile);
    const calibrated = applyScaleCalibration(profile, {
      rankMint: rankResult.rawRankMint,
      campaignSuccessProbability: rankResult.campaignSuccessProbability,
      growthPotential: 90,
    });
    expect(calibrated.rankMint).toBeLessThanOrEqual(82);
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
