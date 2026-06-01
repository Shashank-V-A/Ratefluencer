import type { BrandProfile } from "@/lib/types";

function embed(text: string): number[] {
  const dims = 32;
  const vec = new Array(dims).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    vec[Math.abs(hash) % dims] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const brandDefs: Omit<BrandProfile, "embedding">[] = [
  {
    id: "glowlane",
    name: "Glowlane Skincare",
    category: "D2C Beauty",
    description:
      "Affordable dermatologist-inspired routines for Gen Z. Seeks authentic reel creators who demo AM/PM skincare honestly.",
    targetNiches: ["skincare-routines", "product-recommendations"],
    budgetTier: "growth",
    keywords: ["skincare", "routine", "serum", "SPF", "glass skin"],
  },
  {
    id: "cartdrop",
    name: "CartDrop",
    category: "Affiliate Commerce",
    description:
      "Curated Amazon finds platform. Partners with micro creators who drive saves and link-in-bio conversions.",
    targetNiches: ["amazon-finds", "product-recommendations", "budget-fashion"],
    budgetTier: "startup",
    keywords: ["amazon finds", "under 500", "haul", "must have", "link in bio"],
  },
  {
    id: "campusbrew",
    name: "Campus Brew Co.",
    category: "Food & Beverage",
    description:
      "Specialty coffee for college towns. Wants café reel creators and study-vlog lifestyle integrations.",
    targetNiches: ["cafe-reels", "college-lifestyle"],
    budgetTier: "growth",
    keywords: ["café", "latte", "study session", "campus", "aesthetic"],
  },
  {
    id: "threadline",
    name: "Threadline",
    category: "Budget Fashion",
    description:
      "Trend-forward outfits under ₹999. Needs creators who style hauls and GRWM content with high share rates.",
    targetNiches: ["budget-fashion", "college-lifestyle"],
    budgetTier: "growth",
    keywords: ["outfit", "haul", "affordable", "GRWM", "college fits"],
  },
  {
    id: "nestbox",
    name: "NestBox Home",
    category: "Home & Living",
    description:
      "Compact dorm and apartment upgrades. Matches home-decor and amazon-finds creators.",
    targetNiches: ["home-decor", "amazon-finds"],
    budgetTier: "startup",
    keywords: ["room makeover", "desk setup", "aesthetic room", "organization"],
  },
  {
    id: "pulsefit",
    name: "PulseFit",
    category: "Activewear",
    description:
      "Gym-to-street activewear for young professionals and students. Fitness UGC and lifestyle crossover.",
    targetNiches: ["fitness-ugc", "college-lifestyle"],
    budgetTier: "enterprise",
    keywords: ["workout", "gym", "activewear", "protein", "morning routine"],
  },
];

export const brands: BrandProfile[] = brandDefs.map((b) => ({
  ...b,
  embedding: embed(
    [b.description, b.category, ...b.keywords, ...b.targetNiches].join(" ")
  ),
}));

export function getBrandById(id: string) {
  return brands.find((b) => b.id === id);
}
