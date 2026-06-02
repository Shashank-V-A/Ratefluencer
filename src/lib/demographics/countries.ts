/** ISO 3166-1 alpha-2 → display name (common creator markets) */
export const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  BR: "Brazil",
  MX: "Mexico",
  JP: "Japan",
  KR: "South Korea",
  AE: "United Arab Emirates",
  SG: "Singapore",
  NL: "Netherlands",
  ES: "Spain",
  IT: "Italy",
  PH: "Philippines",
  ID: "Indonesia",
  NG: "Nigeria",
  PK: "Pakistan",
  BD: "Bangladesh",
};

const NAME_TO_ISO: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAMES).map(([iso, name]) => [
    name.toLowerCase(),
    iso,
  ])
);

NAME_TO_ISO.india = "IN";
NAME_TO_ISO.uk = "GB";
NAME_TO_ISO.uae = "AE";
NAME_TO_ISO.usa = "US";

export function countryDisplayName(isoOrName: string): string {
  const v = isoOrName.trim();
  if (!v) return "Global";
  if (v.length === 2) {
    return COUNTRY_NAMES[v.toUpperCase()] ?? v.toUpperCase();
  }
  return v;
}

export function resolveCountryCode(
  location: string,
  bio: string,
  channelCountry?: string
): string | undefined {
  const cc = channelCountry?.trim().toUpperCase();
  if (cc && cc.length === 2) return cc;

  const loc = location.trim();
  if (loc.length === 2) return loc.toUpperCase();
  const locLower = loc.toLowerCase();
  if (NAME_TO_ISO[locLower]) return NAME_TO_ISO[locLower];

  const hay = `${loc} ${bio}`.toLowerCase();
  for (const [name, iso] of Object.entries(NAME_TO_ISO)) {
    if (hay.includes(name)) return iso;
  }

  if (/\bindia\b|\bbengaluru\b|\bmumbai\b|\bdelhi\b|\bbangalore\b/.test(hay))
    return "IN";
  if (/\bunited states\b|\bcalifornia\b|\bnew york\b|\btexas\b/.test(hay))
    return "US";
  if (/\bunited kingdom\b|\blondon\b|\buk\b/.test(hay)) return "GB";
  if (/\bcanada\b|\btoronto\b/.test(hay)) return "CA";
  if (/\baustralia\b|\bsydney\b/.test(hay)) return "AU";

  return undefined;
}
