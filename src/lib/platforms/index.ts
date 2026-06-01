import type { Platform } from "@/lib/types";
import { fetchInstagramCreator } from "./instagram";
import type { FetchedCreatorRaw } from "./types";
import { PlatformApiError } from "./types";
import { fetchXCreator } from "./x";
import { fetchYouTubeCreator } from "./youtube";

export type { FetchedCreatorRaw, FetchedMediaItem } from "./types";
export { PlatformApiError } from "./types";

export async function fetchCreatorFromPlatform(
  platform: Platform,
  handle: string
): Promise<FetchedCreatorRaw> {
  switch (platform) {
    case "instagram":
      return fetchInstagramCreator(handle);
    case "youtube":
      return fetchYouTubeCreator(handle);
    case "x":
      return fetchXCreator(handle);
    case "tiktok":
      throw new PlatformApiError(
        "TikTok public API is not available in this release",
        "UNSUPPORTED",
        501,
        "Use Instagram, YouTube, or X. TikTok demo creators remain in the local dataset."
      );
    default:
      throw new PlatformApiError(`Unknown platform: ${platform}`, "INVALID");
  }
}
