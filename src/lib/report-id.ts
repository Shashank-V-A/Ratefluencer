import type { Platform } from "@/lib/types";

export function encodeLiveReportId(platform: Platform, handle: string): string {
  return `${platform}__${handle.replace(/^@/, "").toLowerCase()}`;
}

export function decodeLiveReportId(id: string): {
  platform: Platform;
  handle: string;
} | null {
  const [platform, ...rest] = id.split("__");
  const handle = rest.join("__");
  if (
    !handle ||
    !["linkedin", "youtube", "x"].includes(platform ?? "")
  ) {
    return null;
  }
  return { platform: platform as Platform, handle };
}
