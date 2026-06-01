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
      "Dermatologist-inspired skincare for Gen Z. Partners with creators who demo routines honestly.",
    budgetTier: "growth",
    keywords: ["skincare", "routine", "serum", "SPF", "glass skin"],
  },
  {
    id: "cartdrop",
    name: "CartDrop",
    category: "Affiliate Commerce",
    description:
      "Curated product discovery platform. Partners with creators who drive saves and link-in-bio conversions.",
    budgetTier: "startup",
    keywords: ["haul", "must have", "link in bio", "deals", "under 500"],
  },
  {
    id: "campusbrew",
    name: "Campus Brew Co.",
    category: "Food & Beverage",
    description:
      "Specialty coffee for college towns. Lifestyle and study-vlog integrations.",
    budgetTier: "growth",
    keywords: ["café", "latte", "study session", "campus", "aesthetic"],
  },
  {
    id: "threadline",
    name: "Threadline",
    category: "Budget Fashion",
    description:
      "Trend-forward affordable fashion. Creators who style hauls and GRWM with high share rates.",
    budgetTier: "growth",
    keywords: ["outfit", "haul", "affordable", "GRWM", "style"],
  },
  {
    id: "nestbox",
    name: "NestBox Home",
    category: "Home & Living",
    description:
      "Compact dorm and apartment upgrades. Room makeover and organization content.",
    budgetTier: "startup",
    keywords: ["room makeover", "desk setup", "aesthetic room", "organization"],
  },
  {
    id: "pulsefit",
    name: "PulseFit",
    category: "Activewear",
    description:
      "Gym-to-street activewear. Fitness and lifestyle crossover creators.",
    budgetTier: "enterprise",
    keywords: ["workout", "gym", "activewear", "protein", "morning routine"],
  },
];

export const brands: BrandProfile[] = brandDefs.map((b) => ({
  ...b,
  embedding: embed([b.description, b.category, ...b.keywords].join(" ")),
}));

export function getBrandById(id: string) {
  return brands.find((b) => b.id === id);
}
