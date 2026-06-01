/**
 * Ensemble weights (logistic regression + gradient-boosted feature importances).
 * Trained offline on micro-UGC campaign outcomes — coefficients are illustrative
 * but deterministic for reproducible demo scoring.
 */
export const RATEFLUENCER_COEFFICIENTS = {
  intercept: -1.82,
  engagementRate: 8.4,
  shareRate: 4.2,
  saveRate: 5.8,
  commentRate: 2.1,
  viewToFollowerRatio: 1.35,
  postingConsistency: 2.9,
  growthRate30d: 3.6,
  audienceQuality: 4.5,
  commentQuality: 3.2,
  contentCategoryFit: 2.7,
  demographicMatch: 1.4,
  authenticityRaw: 5.1,
  microCreatorBonus: 1.8,
} as const;

export const FEATURE_LABELS: Record<keyof typeof RATEFLUENCER_COEFFICIENTS, string> = {
  intercept: "Baseline",
  engagementRate: "Engagement Rate",
  shareRate: "Share Rate",
  saveRate: "Save Rate",
  commentRate: "Comment Quality Signal",
  viewToFollowerRatio: "Reel Reach Ratio",
  postingConsistency: "Posting Consistency",
  growthRate30d: "30d Growth Momentum",
  audienceQuality: "Audience Quality",
  commentQuality: "Comment Authenticity",
  contentCategoryFit: "Commerce Content Fit",
  demographicMatch: "Demographic Alignment",
  authenticityRaw: "Trust Signals",
  microCreatorBonus: "Micro-UGC Fit",
};
