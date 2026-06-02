import { PlatformApiError } from "./types";

type ApiErrorBody = {
  error?: { message?: string; code?: number };
  errors?: { message?: string; detail?: string; title?: string }[];
  title?: string;
  detail?: string;
  status?: number;
};

function parseErrorMessage(
  data: ApiErrorBody,
  status: number,
  platform?: string
): string {
  const detail =
    data.detail ||
    data.errors?.[0]?.detail ||
    data.errors?.[0]?.message ||
    data.error?.message ||
    data.title;

  if (status === 401) {
    return detail && detail !== "Unauthorized"
      ? `Unauthorized: ${detail}`
      : platform === "x"
        ? "Unauthorized — regenerate your X Bearer Token in the developer portal, update .env.local, and restart the dev server."
        : "Unauthorized — check your API key in .env.local.";
  }
  if (status === 402) {
    return data.title === "CreditsDepleted" || detail?.includes("credits")
      ? "X API credits depleted — add credits in the X Developer Portal (Billing) or use YouTube for now."
      : detail || "Payment required — check API billing.";
  }
  if (status === 403) {
    return detail
      ? `Forbidden: ${detail}`
      : platform === "youtube"
        ? "Forbidden — YouTube quota exceeded or API key restricted."
        : "Forbidden — your API tier may not allow this endpoint.";
  }
  if (status === 429) {
    return `${platform ?? "Platform"} rate limit exceeded — wait a few minutes and try again.`;
  }

  return detail || `HTTP ${status}`;
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { bearerToken?: string; platform?: string }
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.bearerToken) {
    const token = init.bearerToken.trim();
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  let res: Response | null = null;
  let networkError: unknown = null;
  const retries = 2;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      res = await fetch(url, { ...init, headers, cache: "no-store" });
    } catch (error) {
      networkError = error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
        continue;
      }
      break;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
    }
    break;
  }
  if (!res) {
    throw new PlatformApiError(
      `Network error while contacting ${init?.platform ?? "platform"} API`,
      "NETWORK_ERROR",
      undefined,
      networkError instanceof Error ? networkError.message : undefined
    );
  }
  const text = await res.text();
  let data: ApiErrorBody = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text.slice(0, 200) };
  }

  if (!res.ok) {
    const platform = init?.platform;
    const code =
      res.status === 401
        ? "UNAUTHORIZED"
        : res.status === 402
          ? "X_CREDITS_DEPLETED"
          : res.status === 403
            ? "FORBIDDEN"
            : res.status === 429
              ? "RATE_LIMIT"
              : "HTTP_ERROR";
    const hint =
      res.status === 429
        ? "Results may be available from cache if you analyzed this creator recently."
        : res.status === 402
          ? "YouTube analysis still works without X credits."
          : undefined;
    throw new PlatformApiError(
      parseErrorMessage(data, res.status, platform),
      code,
      res.status,
      hint
    );
  }

  return data as T;
}
