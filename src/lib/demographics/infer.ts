import type { FetchedCreatorRaw } from "@/lib/platforms/types";
import type { AudienceDemographics, Platform } from "@/lib/types";
import {
  countryDisplayName,
  COUNTRY_NAMES,
  resolveCountryCode,
} from "./countries";

type ContentNiche =
  | "beauty"
  | "tech"
  | "gaming"
  | "fitness"
  | "business"
  | "lifestyle"
  | "general";

const AGE_RANGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55+"] as const;

const NICHE_AGE: Record<ContentNiche, number[]> = {
  beauty: [8, 42, 32, 12, 4, 2],
  tech: [5, 28, 38, 20, 7, 2],
  gaming: [12, 38, 30, 14, 5, 1],
  fitness: [4, 32, 36, 18, 8, 2],
  business: [2, 18, 34, 32, 12, 2],
  lifestyle: [6, 36, 34, 16, 6, 2],
  general: [6, 32, 34, 18, 8, 2],
};

const PLATFORM_AGE_SHIFT: Record<Platform, number[]> = {
  youtube: [0, -2, 2, 1, 0, -1],
  x: [-2, -4, 2, 4, 2, -2],
};

const NICHE_GENDER: Record<
  ContentNiche,
  { female: number; male: number; other: number }
> = {
  beauty: { female: 72, male: 25, other: 3 },
  tech: { female: 28, male: 68, other: 4 },
  gaming: { female: 22, male: 74, other: 4 },
  fitness: { female: 48, male: 50, other: 2 },
  business: { female: 38, male: 58, other: 4 },
  lifestyle: { female: 58, male: 38, other: 4 },
  general: { female: 52, male: 45, other: 3 },
};

const REGION_MIX: Record<
  string,
  { country: string; iso: string; weight: number }[]
> = {
  IN: [
    { iso: "IN", country: "India", weight: 41 },
    { iso: "US", country: "United States", weight: 14 },
    { iso: "GB", country: "United Kingdom", weight: 6 },
    { iso: "AE", country: "United Arab Emirates", weight: 5 },
    { iso: "CA", country: "Canada", weight: 4 },
  ],
  US: [
    { iso: "US", country: "United States", weight: 48 },
    { iso: "GB", country: "United Kingdom", weight: 8 },
    { iso: "CA", country: "Canada", weight: 6 },
    { iso: "IN", country: "India", weight: 5 },
    { iso: "AU", country: "Australia", weight: 4 },
  ],
  GB: [
    { iso: "GB", country: "United Kingdom", weight: 44 },
    { iso: "US", country: "United States", weight: 18 },
    { iso: "IN", country: "India", weight: 6 },
    { iso: "CA", country: "Canada", weight: 5 },
    { iso: "AU", country: "Australia", weight: 4 },
  ],
  CA: [
    { iso: "CA", country: "Canada", weight: 42 },
    { iso: "US", country: "United States", weight: 28 },
    { iso: "GB", country: "United Kingdom", weight: 8 },
    { iso: "IN", country: "India", weight: 4 },
    { iso: "AU", country: "Australia", weight: 3 },
  ],
  AU: [
    { iso: "AU", country: "Australia", weight: 40 },
    { iso: "US", country: "United States", weight: 16 },
    { iso: "GB", country: "United Kingdom", weight: 10 },
    { iso: "IN", country: "India", weight: 5 },
    { iso: "NZ", country: "New Zealand", weight: 4 },
  ],
};

const GLOBAL_MIX = [
  { iso: "US", country: "United States", weight: 28 },
  { iso: "IN", country: "India", weight: 18 },
  { iso: "GB", country: "United Kingdom", weight: 10 },
  { iso: "BR", country: "Brazil", weight: 8 },
  { iso: "CA", country: "Canada", weight: 6 },
];

function detectNiche(text: string): ContentNiche {
  const t = text.toLowerCase();
  if (/skincare|makeup|beauty|fashion|grwm|haul|cosmetic|lipstick/.test(t))
    return "beauty";
  if (/tech|iphone|android|review|unboxing|gadget|laptop|phone|ai\b|coding/.test(t))
    return "tech";
  if (/gaming|gameplay|twitch|esports|fortnite|minecraft/.test(t)) return "gaming";
  if (/fitness|gym|workout|nutrition|yoga|crossfit/.test(t)) return "fitness";
  if (/finance|invest|startup|entrepreneur|business|marketing|saas/.test(t))
    return "business";
  if (/vlog|lifestyle|travel|day in|routine/.test(t)) return "lifestyle";
  return "general";
}

function normalizePercents(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0) || 1;
  const scaled = values.map((v) => Math.max(0, (v / sum) * 100));
  const rounded = scaled.map((v) => Math.round(v));
  const drift = 100 - rounded.reduce((a, b) => a + b, 0);
  if (drift !== 0) rounded[1] = (rounded[1] ?? 0) + drift;
  return rounded;
}

function buildAgeGroups(
  niche: ContentNiche,
  platform: Platform
): { range: string; percent: number }[] {
  const base = NICHE_AGE[niche];
  const shift = PLATFORM_AGE_SHIFT[platform];
  const adjusted = base.map((v, i) => Math.max(1, v + (shift[i] ?? 0)));
  const percents = normalizePercents(adjusted);
  return AGE_RANGES.map((range, i) => ({
    range,
    percent: percents[i] ?? 0,
  }));
}

function buildTopCountries(primaryIso?: string): { country: string; percent: number }[] {
  const mix = (primaryIso && REGION_MIX[primaryIso]) || GLOBAL_MIX;
  const listed = mix.map((m) => ({
    country: m.country ?? countryDisplayName(m.iso),
    percent: m.weight,
  }));
  const listedSum = listed.reduce((s, c) => s + c.percent, 0);
  const rows = [...listed];
  if (listedSum < 100) {
    rows.push({ country: "Other regions", percent: 100 - listedSum });
  }
  return normalizePercents(rows.map((r) => r.percent)).map((percent, i) => ({
    country: rows[i]!.country,
    percent,
  }));
}

function collectCorpus(raw: FetchedCreatorRaw): string {
  const captions = raw.media.map((m) => m.caption).join(" ");
  return [raw.bio, raw.displayName, raw.location, captions].join(" ").slice(0, 8000);
}

/**
 * Estimates audience demographics from public profile signals (location, niche, platform).
 * Labeled source: "inferred" — not platform Insights / Analytics OAuth.
 */
export function inferAudienceDemographics(
  raw: FetchedCreatorRaw,
  purchaseIntent: AudienceDemographics["purchaseIntent"] = "medium"
): AudienceDemographics {
  const channelCountry =
    typeof raw.meta?.channelCountry === "string"
      ? raw.meta.channelCountry
      : undefined;

  const primaryIso = resolveCountryCode(raw.location, raw.bio, channelCountry);
  const niche = detectNiche(collectCorpus(raw));

  return {
    source: "inferred",
    ageGroups: buildAgeGroups(niche, raw.platform),
    topCountries: buildTopCountries(primaryIso),
    genderSplit: { ...NICHE_GENDER[niche] },
    purchaseIntent,
  };
}

export function demographicsSummary(d: AudienceDemographics): string {
  if (d.source === "unavailable") return "Unavailable";
  const topAge = d.ageGroups?.reduce((best, g) =>
    !best || g.percent > best.percent ? g : best
  );
  const topCountry = d.topCountries?.[0];
  const parts: string[] = [];
  if (topAge) parts.push(`${topAge.range} (${topAge.percent}%)`);
  if (topCountry) parts.push(`${topCountry.country} (${topCountry.percent}%)`);
  return parts.join(" · ") || "Estimated";
}

export { detectNiche, countryDisplayName, COUNTRY_NAMES };
