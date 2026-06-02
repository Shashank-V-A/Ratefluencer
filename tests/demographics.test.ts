import { describe, expect, it } from "vitest";
import { inferAudienceDemographics } from "@/lib/demographics/infer";
import type { FetchedCreatorRaw } from "@/lib/platforms/types";

const baseRaw: FetchedCreatorRaw = {
  platform: "youtube",
  handle: "techcreator",
  displayName: "Tech Creator",
  bio: "iPhone reviews and gadget unboxings from Bangalore India",
  location: "IN",
  profileUrl: "https://youtube.com/@techcreator",
  followers: 50_000,
  following: 0,
  mediaCount: 20,
  media: [
    {
      id: "1",
      caption: "MacBook review unboxing tech",
      likes: 1000,
      comments: 80,
      views: 12000,
      shares: 0,
      saves: 0,
      timestamp: new Date().toISOString(),
      mediaType: "video",
    },
  ],
  meta: { channelCountry: "IN" },
};

describe("inferAudienceDemographics", () => {
  it("returns inferred age, country, and gender breakdowns", () => {
    const d = inferAudienceDemographics(baseRaw, "medium");
    expect(d.source).toBe("inferred");
    expect(d.ageGroups?.length).toBeGreaterThan(0);
    expect(d.topCountries?.length).toBeGreaterThan(0);
    expect(d.genderSplit).toBeDefined();

    const ageSum = d.ageGroups!.reduce((s, g) => s + g.percent, 0);
    expect(ageSum).toBeGreaterThanOrEqual(98);
    expect(ageSum).toBeLessThanOrEqual(102);

    expect(d.topCountries![0]!.country).toMatch(/India/i);
  });

  it("skews beauty niche toward younger female-leaning estimates", () => {
    const d = inferAudienceDemographics(
      {
        ...baseRaw,
        platform: "x",
        bio: "makeup tutorial skincare grwm beauty haul",
        media: [
          {
            ...baseRaw.media[0]!,
            caption: "skincare routine makeup tutorial",
          },
        ],
      },
      "high"
    );
    const young =
      (d.ageGroups?.find((g) => g.range === "18-24")?.percent ?? 0) +
      (d.ageGroups?.find((g) => g.range === "25-34")?.percent ?? 0);
    expect(young).toBeGreaterThan(50);
    expect(d.genderSplit!.female).toBeGreaterThan(60);
  });
});
