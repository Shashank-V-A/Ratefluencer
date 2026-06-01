import { PlatformApiError } from "./types";

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { bearerToken?: string }
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.bearerToken) {
    headers.set("Authorization", `Bearer ${init.bearerToken}`);
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = data as { error?: { message?: string; code?: number }; errors?: { message?: string }[] };
    const message =
      err.error?.message ||
      err.errors?.[0]?.message ||
      `HTTP ${res.status}`;
    throw new PlatformApiError(message, "HTTP_ERROR", res.status);
  }

  return data as T;
}
