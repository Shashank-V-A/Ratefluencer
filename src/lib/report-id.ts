import type { Platform } from "@/lib/types";

export function encodeLiveReportId(platform: Platform, handle: string): string {
  return `${platform}__${handle.replace(/^@/, "").toLowerCase()}`;
}

export function parseReportBrandIds(
  brandsParam: string | null | undefined
): string[] | undefined {
  if (!brandsParam?.trim()) return undefined;
  const ids = brandsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
}

export function buildReportBrandQuery(brandIds: string[]): string {
  if (!brandIds.length) return "";
  return `?brands=${encodeURIComponent(brandIds.join(","))}`;
}

export function decodeLiveReportId(id: string): {
  platform: Platform;
  handle: string;
} | null {
  const [platform, ...rest] = id.split("__");
  const handle = rest.join("__");
  if (
    !handle ||
    !["youtube", "x"].includes(platform ?? "")
  ) {
    return null;
  }
  return { platform: platform as Platform, handle };
}
