import type { InfluencerProfile } from "@/lib/types";

export interface MLFeatures {
  engagementRate: number;
  shareRate: number;
  saveRate: number;
  commentRate: number;
  viewToFollowerRatio: number;
  postingConsistency: number;
  growthRate30d: number;
  audienceQuality: number;
  commentQuality: number;
  contentCategoryFit: number;
  demographicMatch: number;
  authenticityRaw: number;
  microCreatorBonus: number;
}

export function extractFeatures(profile: InfluencerProfile): MLFeatures {
  const m = profile.metrics;
  const s = profile.signals;
  const reach = Math.max(m.followers, 1);

  const totalEngagements =
    m.likes + m.comments + m.shares + m.saves || 1;
  const engagementRate = totalEngagements / reach;
  const shareRate = m.shares / totalEngagements;
  const saveRate = m.saves / totalEngagements;
  const commentRate = m.comments / totalEngagements;
  const viewToFollowerRatio = m.avgReelViews / reach;

  const expectedPosts = 12;
  const postingConsistency = Math.min(
    1,
    m.postsLast30Days / expectedPosts
  );

  const growthRate30d = Math.min(
    1,
    Math.max(-0.2, s.followerGrowthSpike30d / 0.25)
  );

  const audienceQuality =
    (1 - s.ghostFollowerEstimate) *
    (profile.demographics.purchaseIntent === "high"
      ? 1
      : profile.demographics.purchaseIntent === "medium"
        ? 0.85
        : 0.65);

  const commentQuality =
    (1 - s.botCommentPercent) * (1 - s.duplicateCommentRate);

  const microCreatorBonus =
    m.followers >= 3_000 && m.followers <= 85_000 ? 1 : 0.72;

  const contentCategoryFit = profile.pastCampaigns > 0
    ? profile.campaignSuccessRate
    : 0.55 + saveRate * 0.3 + shareRate * 0.2;

  const demographicMatch =
    profile.demographics.source === "api"
      ? (profile.demographics.topCountries?.[0]?.percent ?? 50)
      : 50;

  const authenticityRaw =
    1 -
    (s.ghostFollowerEstimate * 0.35 +
      s.podActivityScore * 0.25 +
      s.botCommentPercent * 0.25 +
      Math.min(1, s.followingFollowerRatio * 2) * 0.15);

  return {
    engagementRate: clamp(engagementRate, 0, 0.25),
    shareRate: clamp(shareRate, 0, 1),
    saveRate: clamp(saveRate, 0, 1),
    commentRate: clamp(commentRate, 0, 1),
    viewToFollowerRatio: clamp(viewToFollowerRatio, 0, 3),
    postingConsistency,
    growthRate30d,
    audienceQuality: clamp(audienceQuality, 0, 1),
    commentQuality: clamp(commentQuality, 0, 1),
    contentCategoryFit: clamp(contentCategoryFit, 0, 1),
    demographicMatch: clamp(demographicMatch / 100, 0, 1),
    authenticityRaw: clamp(authenticityRaw, 0, 1),
    microCreatorBonus,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function featuresToVector(f: MLFeatures): number[] {
  return [
    f.engagementRate,
    f.shareRate,
    f.saveRate,
    f.commentRate,
    f.viewToFollowerRatio,
    f.postingConsistency,
    f.growthRate30d,
    f.audienceQuality,
    f.commentQuality,
    f.contentCategoryFit,
    f.demographicMatch,
    f.authenticityRaw,
    f.microCreatorBonus,
  ];
}
