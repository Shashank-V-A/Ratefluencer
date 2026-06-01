import { PlatformApiError } from "./types";

type ApiErrorBody = {
  error?: { message?: string; code?: number };
  errors?: { message?: string; detail?: string; title?: string }[];
  title?: string;
  detail?: string;
  status?: number;
};

function parseErrorMessage(data: ApiErrorBody, status: number): string {
  const detail =
    data.detail ||
    data.errors?.[0]?.detail ||
    data.errors?.[0]?.message ||
    data.error?.message ||
    data.title;

  if (status === 401) {
    return detail && detail !== "Unauthorized"
      ? `Unauthorized: ${detail}`
      : "Unauthorized — your X Bearer Token was rejected. Regenerate it in the X Developer Portal (OAuth 2.0 → Bearer Token), paste into .env.local, and restart npm run dev. This is not a free-tier limit.";
  }
  if (status === 402) {
    return (
      data.title === "CreditsDepleted" || detail?.includes("credits")
        ? "X API credits depleted — your pay-as-you-go account has no credits left. Add credits in the X Developer Portal (Billing) or use YouTube for now."
        : detail || "Payment required — check X API billing."
    );
  }
  if (status === 403) {
    return detail
      ? `Forbidden: ${detail}`
      : "Forbidden — your X API tier may not allow this endpoint.";
  }
  if (status === 429) {
    return "Rate limit exceeded — wait a few minutes or check your X API usage.";
  }

  return detail || `HTTP ${status}`;
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { bearerToken?: string }
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.bearerToken) {
    const token = init.bearerToken.trim();
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  let data: ApiErrorBody = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text.slice(0, 200) };
  }

  if (!res.ok) {
    const code =
      res.status === 401
        ? "X_UNAUTHORIZED"
        : res.status === 402
          ? "X_CREDITS_DEPLETED"
          : "HTTP_ERROR";
    throw new PlatformApiError(parseErrorMessage(data, res.status), code, res.status);
  }

  return data as T;
}
