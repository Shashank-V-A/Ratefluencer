import type { Platform } from "@/lib/types";

export interface FetchedMediaItem {
  id: string;
  caption: string;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  saves: number;
  timestamp: string;
  mediaType?: string;
}

export interface FetchedCreatorRaw {
  platform: Platform;
  handle: string;
  displayName: string;
  bio: string;
  location: string;
  profileUrl: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  mediaCount: number;
  media: FetchedMediaItem[];
  /** Platform-specific extras */
  meta?: Record<string, unknown>;
}

export class PlatformApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly hint?: string
  ) {
    super(message);
    this.name = "PlatformApiError";
  }
}
