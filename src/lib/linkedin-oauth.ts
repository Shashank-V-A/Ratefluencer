import { cookies } from "next/headers";

const LI_COOKIE = "rankmint_li_oauth";
const LI_STATE_COOKIE = "rankmint_li_oauth_state";

export type LinkedInOAuthCookie = {
  accessToken: string;
  expiresAt?: number;
  vanityName?: string;
  displayName?: string;
  scope?: string;
};

function b64urlEncode(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf8");
}

function serialize(value: LinkedInOAuthCookie) {
  return b64urlEncode(JSON.stringify(value));
}

function parse(value: string | undefined): LinkedInOAuthCookie | null {
  if (!value) return null;
  try {
    return JSON.parse(b64urlDecode(value)) as LinkedInOAuthCookie;
  } catch {
    return null;
  }
}

export function getLinkedInOAuthConfig() {
  return {
    clientId: process.env.LINKEDIN_OAUTH_CLIENT_ID?.trim(),
    clientSecret: process.env.LINKEDIN_OAUTH_CLIENT_SECRET?.trim(),
    redirectUri:
      process.env.LINKEDIN_OAUTH_REDIRECT_URI?.trim() ??
      "http://localhost:3000/api/oauth/linkedin/callback",
  };
}

export function isLinkedInOAuthConfigured() {
  const cfg = getLinkedInOAuthConfig();
  return Boolean(cfg.clientId && cfg.clientSecret && cfg.redirectUri);
}

export async function getLinkedInOAuthSession() {
  const jar = await cookies();
  return parse(jar.get(LI_COOKIE)?.value);
}

export async function setLinkedInOAuthSession(data: LinkedInOAuthCookie) {
  const jar = await cookies();
  jar.set(LI_COOKIE, serialize(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function clearLinkedInOAuthSession() {
  const jar = await cookies();
  jar.delete(LI_COOKIE);
}

export async function setLinkedInOAuthState(state: string) {
  const jar = await cookies();
  jar.set(LI_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export async function consumeLinkedInOAuthState() {
  const jar = await cookies();
  const state = jar.get(LI_STATE_COOKIE)?.value;
  jar.delete(LI_STATE_COOKIE);
  return state;
}

export async function getValidLinkedInAccessToken() {
  const session = await getLinkedInOAuthSession();
  if (!session?.accessToken) return null;
  if (!session.expiresAt || session.expiresAt > Date.now() + 30_000) {
    return session.accessToken;
  }
  return null;
}

export async function fetchLinkedInProfileMeta(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  let vanityName: string | undefined;
  let headline: string | undefined;
  let displayName: string | undefined;
  let avatarUrl: string | undefined;

  try {
    const userinfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers,
      cache: "no-store",
    });
    if (userinfoRes.ok) {
      const ui = (await userinfoRes.json()) as {
        name?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
      displayName =
        ui.name ??
        [ui.given_name, ui.family_name].filter(Boolean).join(" ").trim();
      avatarUrl = ui.picture;
    }
  } catch {
    // optional
  }

  try {
    const meRes = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,vanityName,localizedHeadline,localizedFirstName,localizedLastName)",
      { headers, cache: "no-store" }
    );
    if (meRes.ok) {
      const me = (await meRes.json()) as {
        vanityName?: string;
        localizedHeadline?: string;
        localizedFirstName?: string;
        localizedLastName?: string;
      };
      vanityName = me.vanityName;
      headline = me.localizedHeadline;
      if (!displayName) {
        displayName = [me.localizedFirstName, me.localizedLastName]
          .filter(Boolean)
          .join(" ")
          .trim();
      }
    }
  } catch {
    // optional
  }

  return { vanityName, headline, displayName, avatarUrl };
}
