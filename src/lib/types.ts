export type ContentNiche =
  | "skincare-routines"
  | "amazon-finds"
  | "budget-fashion"
  | "cafe-reels"
  | "college-lifestyle"
  | "product-recommendations"
  | "fitness-ugc"
  | "home-decor";

export type Platform = "instagram" | "youtube" | "x" | "tiktok";

export interface AnalysisMeta {
  source: "demo" | "live";
  fetchedAt: string;
  profileUrl?: string;
  avatarUrl?: string;
  warnings?: string[];
}

export interface AudienceDemographics {
  ageGroups: { range: string; percent: number }[];
  topCountries: { country: string; percent: number }[];
  genderSplit: { female: number; male: number; other: number };
  purchaseIntent: "low" | "medium" | "high";
}

export interface InfluencerMetrics {
  followers: number;
  following: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  postsLast30Days: number;
  postsLast90Days: number;
  avgReelViews: number;
  avgReelDurationSec: number;
}

export interface InfluencerProfile {
  id: string;
  handle: string;
  displayName: string;
  platform: Platform;
  niche: ContentNiche;
  nicheLabel: string;
  bio: string;
  location: string;
  avatarGradient: string;
  metrics: InfluencerMetrics;
  demographics: AudienceDemographics;
  /** Synthetic signals for authenticity ML */
  signals: {
    followerGrowthSpike30d: number;
    commentToLikeRatio: number;
    saveToLikeRatio: number;
    shareToLikeRatio: number;
    engagementVariance: number;
    followingFollowerRatio: number;
    ghostFollowerEstimate: number;
    podActivityScore: number;
    botCommentPercent: number;
    duplicateCommentRate: number;
  };
  contentTags: string[];
  pastCampaigns: number;
  campaignSuccessRate: number;
}

export interface BrandProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  targetNiches: ContentNiche[];
  budgetTier: "startup" | "growth" | "enterprise";
  keywords: string[];
  embedding: number[];
}

export interface ScoreBreakdown {
  authenticity: number;
  growthPotential: number;
  brandMatch: number;
  ratefluencer: number;
  campaignSuccessProbability: number;
}

export interface AuthenticityFlags {
  purchasedFollowers: "low" | "medium" | "high";
  engagementPods: "low" | "medium" | "high";
  botActivity: "low" | "medium" | "high";
  artificialSpikes: "low" | "medium" | "high";
}

export interface AnalysisResult {
  profile: InfluencerProfile;
  scores: ScoreBreakdown;
  authenticityFlags: AuthenticityFlags;
  growthForecast: {
    followerGrowth90d: number;
    engagementGrowth90d: number;
    audienceExpansion: number;
  };
  brandRecommendations: {
    brand: BrandProfile;
    score: number;
    rationale: string;
  }[];
  featureImportance: { feature: string; impact: number }[];
  modelVersion: string;
  meta?: AnalysisMeta;
}
