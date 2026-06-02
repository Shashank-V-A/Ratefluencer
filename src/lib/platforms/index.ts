import type { Platform } from "@/lib/types";
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
    case "youtube":
      return fetchYouTubeCreator(handle);
    case "x":
      return fetchXCreator(handle);
    default:
      throw new PlatformApiError(`Unknown platform: ${platform}`, "INVALID");
  }
}
