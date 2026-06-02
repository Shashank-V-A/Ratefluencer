/**
 * Logistic-regression coefficients exported from ml/train_model.py
 * (ml/campaign_labels.csv or synthetic fallback — see ml/README.md).
 * Regenerate: npm run ml:train
 */
export const RANK_MINT_COEFFICIENTS = {
  intercept: -12.551258,
  engagementRate: 0.247061,
  shareRate: 0.568207,
  saveRate: 1.445581,
  commentRate: 0.450339,
  viewToFollowerRatio: 2.449111,
  postingConsistency: 3.867437,
  growthRate30d: 3.434437,
  audienceQuality: 2.259891,
  commentQuality: 1.393793,
  contentCategoryFit: 2.635375,
  demographicMatch: 0.602149,
  authenticityRaw: 1.208636,
  microCreatorBonus: 1.767976,
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
