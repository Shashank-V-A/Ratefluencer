import { cookies } from "next/headers";

const YT_COOKIE = "rankmint_yt_oauth";
const YT_STATE_COOKIE = "rankmint_yt_oauth_state";

type YouTubeOAuthCookie = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
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
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf8");
}

function serialize(value: YouTubeOAuthCookie) {
  return b64urlEncode(JSON.stringify(value));
}

function parse(value: string | undefined): YouTubeOAuthCookie | null {
  if (!value) return null;
  try {
    return JSON.parse(b64urlDecode(value)) as YouTubeOAuthCookie;
  } catch {
    return null;
  }
}

export function getYouTubeOAuthConfig() {
  return {
    clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID?.trim(),
    clientSecret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET?.trim(),
    redirectUri:
      process.env.YOUTUBE_OAUTH_REDIRECT_URI?.trim() ??
      "http://localhost:3000/api/oauth/youtube/callback",
  };
}

export function isYouTubeOAuthConfigured() {
  const cfg = getYouTubeOAuthConfig();
  return Boolean(cfg.clientId && cfg.clientSecret && cfg.redirectUri);
}

export async function getYouTubeOAuthSession() {
  const jar = await cookies();
  return parse(jar.get(YT_COOKIE)?.value);
}

export async function setYouTubeOAuthSession(data: YouTubeOAuthCookie) {
  const jar = await cookies();
  jar.set(YT_COOKIE, serialize(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearYouTubeOAuthSession() {
  const jar = await cookies();
  jar.delete(YT_COOKIE);
}

export async function setYouTubeOAuthState(state: string) {
  const jar = await cookies();
  jar.set(YT_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export async function consumeYouTubeOAuthState() {
  const jar = await cookies();
  const state = jar.get(YT_STATE_COOKIE)?.value;
  jar.delete(YT_STATE_COOKIE);
  return state;
}

async function refreshAccessToken(refreshToken: string) {
  const cfg = getYouTubeOAuthConfig();
  if (!cfg.clientId || !cfg.clientSecret) return null;

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

export async function getValidYouTubeAccessToken() {
  const session = await getYouTubeOAuthSession();
  if (!session?.accessToken) return null;

  if (!session.expiresAt || session.expiresAt > Date.now() + 30_000) {
    return session.accessToken;
  }
  if (!session.refreshToken) return null;

  const refreshed = await refreshAccessToken(session.refreshToken);
  if (!refreshed) return null;

  try {
    await setYouTubeOAuthSession({
      accessToken: refreshed.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: refreshed.expiresAt,
      scope: session.scope,
    });
  } catch {
    // Read-only contexts (e.g. server components) may not allow cookie writes.
  }

  return refreshed.accessToken;
}
