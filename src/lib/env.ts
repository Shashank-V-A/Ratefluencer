export type PlatformEnvStatus = {
  configured: boolean;
  missing: string[];
};

function has(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

export function getYouTubeStatus(): PlatformEnvStatus {
  const missing: string[] = [];
  if (!process.env.YOUTUBE_API_KEY?.trim()) missing.push("YOUTUBE_API_KEY");
  return { configured: missing.length === 0, missing };
}

export function getInstagramStatus(): PlatformEnvStatus {
  const missing: string[] = [];
  if (!process.env.META_GRAPH_ACCESS_TOKEN?.trim())
    missing.push("META_GRAPH_ACCESS_TOKEN");
  if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim())
    missing.push("INSTAGRAM_BUSINESS_ACCOUNT_ID");
  return { configured: missing.length === 0, missing };
}

export function getXStatus(): PlatformEnvStatus {
  const token =
    process.env.X_API_BEARER_TOKEN?.trim() ||
    process.env.TWITTER_BEARER_TOKEN?.trim();
  const missing: string[] = [];
  if (!token) missing.push("X_API_BEARER_TOKEN (or TWITTER_BEARER_TOKEN)");
  return { configured: missing.length === 0, missing };
}

export function getAllPlatformStatus() {
  return {
    youtube: getYouTubeStatus(),
    instagram: getInstagramStatus(),
    x: getXStatus(),
  };
}

export function getXBearerToken(): string | undefined {
  return (
    process.env.X_API_BEARER_TOKEN?.trim() ||
    process.env.TWITTER_BEARER_TOKEN?.trim()
  );
}
