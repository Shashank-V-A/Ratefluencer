/**
 * Logistic-regression coefficients exported from ml/train_model.py
 * (ml/campaign_labels.csv or synthetic fallback — see ml/README.md).
 * Regenerate: npm run ml:train
 */
export const RANK_MINT_COEFFICIENTS = {
  intercept: -12.016299,
  engagementRate: 0.263633,
  shareRate: 0.430643,
  saveRate: 1.494501,
  commentRate: 0.279591,
  viewToFollowerRatio: 2.301879,
  postingConsistency: 3.813030,
  growthRate30d: 2.852436,
  audienceQuality: 2.145991,
  commentQuality: 1.281919,
  contentCategoryFit: 2.315536,
  demographicMatch: -0.016244,
  authenticityRaw: 1.218834,
  microCreatorBonus: 2.717677,
} as const;

export const FEATURE_LABELS: Record<keyof typeof RANK_MINT_COEFFICIENTS, string> = {
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

export const MODEL_VERSION = "rm-trained-v1.1-campaign-labels";
