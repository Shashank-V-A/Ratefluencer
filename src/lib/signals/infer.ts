import type { FetchedCreatorRaw } from "@/lib/platforms/types";
import type { InfluencerProfile } from "@/lib/types";

function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function variance(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  return (
    nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length
  );
}

function stdDev(nums: number[]): number {
  return Math.sqrt(variance(nums));
}

function coefficientOfVariation(nums: number[]): number {
  const mean = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  if (mean === 0) return 0;
  return stdDev(nums) / mean;
}

/** Heuristic authenticity signals from real post-level metrics */
export function inferSignals(
  raw: FetchedCreatorRaw,
  aggregates: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalViews: number;
    postsLast30: number;
    postsLast90: number;
    avgViews: number;
  }
): InfluencerProfile["signals"] {
  const { followers, following, media } = raw;
  const reach = Math.max(followers, 1);
  const totalLikes = Math.max(aggregates.totalLikes, 1);

  const engagementRates = media.map((m) => {
    const eng = m.likes + m.comments + m.shares + m.saves;
    return eng / reach;
  });

  const engVariance = Math.min(
    1,
    coefficientOfVariation(engagementRates) * 1.2
  );

  const commentToLikeRatio = aggregates.totalComments / totalLikes;
  const saveToLikeRatio = aggregates.totalSaves / totalLikes;
  const shareToLikeRatio = aggregates.totalShares / totalLikes;

  const followingFollowerRatio = following / reach;

  const avgEngPerPost =
    media.length > 0
      ? media.reduce(
          (s, m) => s + m.likes + m.comments + m.shares,
          0
        ) / media.length
      : 0;
  const expectedEng = reach * 0.03;
  const ghostFollowerEstimate = Math.min(
    0.85,
    Math.max(
      0,
      1 - avgEngPerPost / Math.max(expectedEng, 1)
    ) * 0.9
  );

  const recent = media.filter((m) => daysAgo(m.timestamp) <= 30);
  const older = media.filter(
    (m) => daysAgo(m.timestamp) > 30 && daysAgo(m.timestamp) <= 90
  );
  const recentEng =
    recent.reduce((s, m) => s + m.likes, 0) / Math.max(recent.length, 1);
  const olderEng =
    older.reduce((s, m) => s + m.likes, 0) / Math.max(older.length, 1);
  const followerGrowthSpike30d =
    olderEng > 0
      ? Math.min(0.8, Math.max(0, (recentEng - olderEng) / olderEng))
      : 0.1;

  const commentTexts = media.flatMap((m) =>
    (m.caption || "").toLowerCase().split(/\s+/)
  );
  const generic = ["nice", "great", "wow", "fire", "🔥", "follow", "dm"];
  const genericHits = commentTexts.filter((w) =>
    generic.some((g) => w.includes(g))
  ).length;
  const botCommentPercent = Math.min(
    0.5,
    genericHits / Math.max(commentTexts.length, 50)
  );

  const captions = media.map((m) => m.caption.toLowerCase().trim());
  const dupRate =
    captions.length > 1
      ? 1 -
        new Set(captions).size / captions.length
      : 0;

  const podActivityScore = Math.min(
    0.7,
    dupRate * 0.5 + (commentToLikeRatio < 0.01 ? 0.2 : 0)
  );

  return {
    followerGrowthSpike30d,
    commentToLikeRatio,
    saveToLikeRatio,
    shareToLikeRatio,
    engagementVariance: engVariance,
    followingFollowerRatio,
    ghostFollowerEstimate,
    podActivityScore,
    botCommentPercent,
    duplicateCommentRate: dupRate,
  };
}

export function defaultDemographics(
  followers: number,
  purchaseIntent: "low" | "medium" | "high" = "medium"
): InfluencerProfile["demographics"] {
  const micro = followers < 100_000;
  return {
    ageGroups: micro
      ? [
          { range: "18-24", percent: 48 },
          { range: "25-34", percent: 36 },
        ]
      : [
          { range: "25-34", percent: 38 },
          { range: "35-44", percent: 28 },
        ],
    topCountries: [{ country: "Global (API)", percent: 72 }],
    genderSplit: { female: 55, male: 42, other: 3 },
    purchaseIntent,
  };
}
