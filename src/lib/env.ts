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

function normalizeEnvSecret(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  if (v.toLowerCase().startsWith("bearer ")) {
    v = v.slice(7).trim();
  }
  if (v.includes("%")) {
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return v;
}

export function getXBearerToken(): string | undefined {
  return (
    normalizeEnvSecret(process.env.X_API_BEARER_TOKEN) ||
    normalizeEnvSecret(process.env.TWITTER_BEARER_TOKEN)
  );
}

/** Platforms you can use without Instagram */
export function getCorePlatformStatus() {
  return {
    youtube: getYouTubeStatus(),
    x: getXStatus(),
  };
}

export function isInstagramOptional() {
  return !getInstagramStatus().configured;
}

export function getOpenAIStatus(): PlatformEnvStatus & { optional: true } {
  const missing: string[] = [];
  if (!process.env.OPENAI_API_KEY?.trim()) missing.push("OPENAI_API_KEY");
  return { configured: missing.length === 0, missing, optional: true };
}

export function getSupabaseStatus(): PlatformEnvStatus {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { configured: missing.length === 0, missing };
}
