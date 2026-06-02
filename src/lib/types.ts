export type Platform = "youtube" | "x";

export interface AnalysisMeta {
  source: "live";
  fetchedAt: string;
  profileUrl?: string;
  avatarUrl?: string;
  warnings?: string[];
  cached?: boolean;
  cacheExpiresAt?: string;
  embeddingProvider?: "openai" | "fallback";
  modelVersion?: string;
  scoringNotes?: string[];
  sampleSize?: number;
  confidence?: number;
  freshnessMinutes?: number;
  /** Brand workspace IDs used for partnership scoring on this run */
  brandIds?: string[];
}

export interface AudienceDemographics {
  source: "api" | "inferred" | "unavailable";
  ageGroups?: { range: string; percent: number }[];
  topCountries?: { country: string; percent: number }[];
  genderSplit?: { female: number; male: number; other: number };
  purchaseIntent?: "low" | "medium" | "high";
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
  /** When false, excluded from full-analysis brand match section */
  includeInAnalysis?: boolean;
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
  embeddingProvider?: "openai" | "fallback";
  creatorTier?: "micro" | "mid" | "mega";
  scoringNotes?: string[];
  rawRankMint?: number;
  explainability?: {
    authenticity: {
      summary: string;
      positives: string[];
      negatives: string[];
      confidence: number;
      sampleSize: number;
    };
    growthPotential: {
      summary: string;
      positives: string[];
      negatives: string[];
      confidence: number;
      sampleSize: number;
    };
    brandMatch: {
      summary: string;
      positives: string[];
      negatives: string[];
      confidence: number;
      sampleSize: number;
    };
    campaignSuccessProbability: {
      summary: string;
      positives: string[];
      negatives: string[];
      confidence: number;
      sampleSize: number;
    };
    rankMint: {
      summary: string;
      positives: string[];
      negatives: string[];
      confidence: number;
      sampleSize: number;
    };
  };
  modelMetrics?: {
    dataset: string;
    rows: number;
    testAccuracy: number;
    auc?: number;
    f1?: number;
    lastTrainedAt?: string;
  };
  meta?: AnalysisMeta;
}

export type CompareObjective = "brand_safety" | "growth" | "roi";

export type BrandPriorityWeights = {
  nicheFit: number;
  geographyFit: number;
  engagementQuality: number;
};
