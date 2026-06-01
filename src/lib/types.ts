export type Platform = "instagram" | "youtube" | "x";

export interface AnalysisMeta {
  source: "live";
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
  bio: string;
  location: string;
  avatarGradient: string;
  metrics: InfluencerMetrics;
  demographics: AudienceDemographics;
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
  pastCampaigns: number;
  campaignSuccessRate: number;
}

export interface BrandProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  budgetTier: "startup" | "growth" | "enterprise";
  keywords: string[];
  embedding: number[];
}

export interface ScoreBreakdown {
  authenticity: number;
  growthPotential: number;
  brandMatch: number;
  rankMint: number;
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
