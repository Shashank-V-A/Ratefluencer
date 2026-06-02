import type { InfluencerProfile } from "@/lib/types";
import { clampFinite, finiteOr } from "./safe-number";

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

  const likes = finiteOr(m.likes);
  const comments = finiteOr(m.comments);
  const shares = finiteOr(m.shares);
  const saves = finiteOr(m.saves);
  const totalEngagements = Math.max(likes + comments + shares + saves, 1);
  const engagementRate = totalEngagements / reach;
  const shareRate = shares / totalEngagements;
  const saveRate = saves / totalEngagements;
  const commentRate = comments / totalEngagements;
  const viewToFollowerRatio = finiteOr(m.avgReelViews) / reach;

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
    ? finiteOr(profile.campaignSuccessRate, 0.55)
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
    engagementRate: clampFinite(engagementRate, 0, 0.25),
    shareRate: clampFinite(shareRate, 0, 1),
    saveRate: clampFinite(saveRate, 0, 1),
    commentRate: clampFinite(commentRate, 0, 1),
    viewToFollowerRatio: clampFinite(viewToFollowerRatio, 0, 3),
    postingConsistency: clampFinite(postingConsistency, 0, 1),
    growthRate30d: clampFinite(growthRate30d, -0.2, 1),
    audienceQuality: clampFinite(audienceQuality, 0, 1),
    commentQuality: clampFinite(commentQuality, 0, 1),
    contentCategoryFit: clampFinite(contentCategoryFit, 0, 1),
    demographicMatch: clampFinite(demographicMatch / 100, 0, 1),
    authenticityRaw: clampFinite(authenticityRaw, 0, 1),
    microCreatorBonus: finiteOr(microCreatorBonus, 0.72),
  };
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
