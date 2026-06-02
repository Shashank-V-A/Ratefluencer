import { getLinkedInAccessToken, getLinkedInStatus } from "@/lib/env";
import {
  getLinkedInOAuthSession,
  getValidLinkedInAccessToken,
} from "@/lib/linkedin-oauth";
import { fetchJson } from "./http";
import type { FetchedCreatorRaw, FetchedMediaItem } from "./types";
import { PlatformApiError } from "./types";

const LINKEDIN_V2 = "https://api.linkedin.com/v2";
const LINKEDIN_REST = "https://api.linkedin.com/rest";

interface LinkedInPersonResponse {
  elements?: {
    localizedFirstName?: string;
    localizedLastName?: string;
    localizedHeadline?: string;
    vanityName?: string;
    id?: string;
  }[];
  status?: number;
  message?: string;
  serviceErrorCode?: number;
}

interface LinkedInOrgResponse {
  elements?: {
    localizedName?: string;
    vanityName?: string;
    id?: string;
    followerCount?: number;
    description?: string;
    logoV2?: {
      "original~"?: {
        elements?: { identifiers?: { identifier?: string }[] }[];
      };
    };
  }[];
  status?: number;
  message?: string;
}

function linkedInHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": "202410",
  };
}

function normalizeHandle(handle: string): {
  vanity: string;
  kind: "person" | "organization";
} {
  const trimmed = handle.trim();
  const inMatch = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (inMatch) {
    return { vanity: decodeURIComponent(inMatch[1]!), kind: "person" };
  }
  const companyMatch = trimmed.match(/linkedin\.com\/company\/([^/?#]+)/i);
  if (companyMatch) {
    return {
      vanity: decodeURIComponent(companyMatch[1]!),
      kind: "organization",
    };
  }
  const vanity = trimmed.replace(/^@/, "").replace(/\/$/, "");
  return { vanity, kind: "person" };
}

function partnerAccessHint(connectedVanity?: string): string {
  const selfHint = connectedVanity
    ? ` Sign in with LinkedIn and analyze your own handle (${connectedVanity}) or use YouTube / X for other creators.`
    : " Sign in with LinkedIn on the home page to analyze your own profile, or use YouTube / X for other creators.";
  return (
    "LinkedIn only allows looking up other members’ profiles for approved partner apps." +
    selfHint +
    " See https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-vanity-name-api"
  );
}

async function resolveLinkedInToken(): Promise<string | null> {
  const sessionToken = await getValidLinkedInAccessToken();
  if (sessionToken) return sessionToken;
  return getLinkedInAccessToken() ?? null;
}

async function fetchConnectedMember(
  token: string,
  vanity: string
): Promise<FetchedCreatorRaw | null> {
  const session = await getLinkedInOAuthSession();
  const sessionVanity = session?.vanityName?.toLowerCase();
  const target = vanity.toLowerCase();
  const isSelf =
    target === "me" ||
    (sessionVanity && (sessionVanity === target || target === sessionVanity));

  if (!isSelf) return null;

  const headers = linkedInHeaders(token);
  let displayName = session?.displayName ?? "";
  let bio = "";
  let vanityName = sessionVanity ?? vanity;
  let avatarUrl: string | undefined;

  try {
    const userinfo = await fetchJson<{
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    }>("https://api.linkedin.com/v2/userinfo", { headers, platform: "linkedin" });
    displayName =
      userinfo.name ??
      [userinfo.given_name, userinfo.family_name].filter(Boolean).join(" ").trim();
    avatarUrl = userinfo.picture;
  } catch {
    // optional
  }

  try {
    const me = await fetchJson<{
      vanityName?: string;
      localizedHeadline?: string;
      localizedFirstName?: string;
      localizedLastName?: string;
      id?: string;
    }>(
      `${LINKEDIN_V2}/me?projection=(id,vanityName,localizedHeadline,localizedFirstName,localizedLastName)`,
      { headers, platform: "linkedin" }
    );
    vanityName = me.vanityName ?? vanityName;
    bio = me.localizedHeadline ?? "";
    if (!displayName) {
      displayName = [me.localizedFirstName, me.localizedLastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    }
    return {
      platform: "linkedin",
      handle: vanityName,
      displayName: displayName || vanityName,
      bio,
      location: "",
      profileUrl: `https://www.linkedin.com/in/${vanityName}/`,
      avatarUrl,
      followers: 0,
      following: 0,
      mediaCount: 0,
      media: [] as FetchedMediaItem[],
      meta: { linkedinId: me.id, profileType: "person", source: "oauth_me" },
    };
  } catch {
    if (!displayName && !vanityName) return null;
    return {
      platform: "linkedin",
      handle: vanityName,
      displayName: displayName || vanityName,
      bio,
      location: "",
      profileUrl: `https://www.linkedin.com/in/${vanityName}/`,
      avatarUrl,
      followers: 0,
      following: 0,
      mediaCount: 0,
      media: [] as FetchedMediaItem[],
      meta: { profileType: "person", source: "oauth_userinfo" },
    };
  }
}

async function fetchPersonByVanity(
  vanity: string,
  token: string
): Promise<FetchedCreatorRaw | null> {
  const projection =
    "(elements*(localizedFirstName,localizedLastName,localizedHeadline,vanityName,id))";
  const url = `${LINKEDIN_V2}/people?q=vanityName&vanityName=${encodeURIComponent(vanity)}&projection=${encodeURIComponent(projection)}`;

  try {
    const data = await fetchJson<LinkedInPersonResponse>(url, {
      headers: linkedInHeaders(token),
      platform: "linkedin",
    });
    const person = data.elements?.[0];
    if (!person?.vanityName && !person?.localizedFirstName) return null;

    const displayName = [person.localizedFirstName, person.localizedLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const vanityName = person.vanityName ?? vanity;

    return {
      platform: "linkedin",
      handle: vanityName,
      displayName: displayName || vanityName,
      bio: person.localizedHeadline ?? "",
      location: "",
      profileUrl: `https://www.linkedin.com/in/${vanityName}/`,
      followers: 0,
      following: 0,
      mediaCount: 0,
      media: [] as FetchedMediaItem[],
      meta: { linkedinId: person.id, profileType: "person" },
    };
  } catch (e) {
    if (e instanceof PlatformApiError && e.status === 404) return null;
    throw e;
  }
}

async function fetchOrganizationByVanity(
  vanity: string,
  token: string
): Promise<FetchedCreatorRaw | null> {
  const url = `${LINKEDIN_REST}/organizations?q=vanityName&vanityName=${encodeURIComponent(vanity)}`;

  try {
    const data = await fetchJson<LinkedInOrgResponse>(url, {
      headers: linkedInHeaders(token),
      platform: "linkedin",
    });
    const org = data.elements?.[0];
    if (!org?.vanityName && !org?.localizedName) return null;

    const vanityName = org.vanityName ?? vanity;
    let avatarUrl: string | undefined;
    const logoElements = org.logoV2?.["original~"]?.elements;
    const logoId = logoElements?.[0]?.identifiers?.[0]?.identifier;
    if (logoId) avatarUrl = logoId;

    return {
      platform: "linkedin",
      handle: vanityName,
      displayName: org.localizedName ?? vanityName,
      bio: org.description ?? "",
      location: "",
      profileUrl: `https://www.linkedin.com/company/${vanityName}/`,
      avatarUrl,
      followers: org.followerCount ?? 0,
      following: 0,
      mediaCount: 0,
      media: [] as FetchedMediaItem[],
      meta: { linkedinId: org.id, profileType: "organization" },
    };
  } catch (e) {
    if (e instanceof PlatformApiError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchLinkedInCreator(
  handle: string
): Promise<FetchedCreatorRaw> {
  const status = getLinkedInStatus();
  if (!status.configured) {
    throw new PlatformApiError(
      "LinkedIn API is not configured",
      "NOT_CONFIGURED",
      503,
      `Add to .env.local: ${status.missing.join(", ")}. Create a LinkedIn Developer app and generate an OAuth access token with profile permissions.`
    );
  }

  const token = await resolveLinkedInToken();
  if (!token) {
    throw new PlatformApiError(
      "LinkedIn is not connected",
      "NOT_CONFIGURED",
      503,
      "Sign in with LinkedIn on the home page, or set LINKEDIN_ACCESS_TOKEN in .env.local."
    );
  }

  const session = await getLinkedInOAuthSession();
  const { vanity, kind } = normalizeHandle(handle);
  if (!vanity) {
    throw new PlatformApiError(
      "Enter a LinkedIn vanity name or profile URL (e.g. linkedin.com/in/username)",
      "INVALID",
      400
    );
  }

  try {
    const selfProfile = await fetchConnectedMember(token, vanity);
    if (selfProfile) return selfProfile;

    if (kind === "organization") {
      const org = await fetchOrganizationByVanity(vanity, token);
      if (org) return org;
    } else {
      const person = await fetchPersonByVanity(vanity, token);
      if (person) return person;
      const org = await fetchOrganizationByVanity(vanity, token);
      if (org) return org;
    }

    throw new PlatformApiError(
      `LinkedIn profile "${vanity}" not found`,
      "NOT_FOUND",
      404,
      partnerAccessHint(session?.vanityName)
    );
  } catch (e) {
    if (!(e instanceof PlatformApiError)) throw e;
    if (e.status === 403 || e.message.toLowerCase().includes("permission")) {
      throw new PlatformApiError(
        "LinkedIn denied access to this profile lookup",
        "FORBIDDEN",
        403,
        partnerAccessHint(session?.vanityName)
      );
    }
    throw e;
  }
}
