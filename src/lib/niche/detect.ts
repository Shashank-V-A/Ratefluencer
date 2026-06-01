import type { ContentNiche } from "@/lib/types";

const NICHE_RULES: { niche: ContentNiche; label: string; keywords: string[] }[] = [
  {
    niche: "skincare-routines",
    label: "Skincare Routines",
    keywords: ["skincare", "serum", "spf", "sunscreen", "routine", "glow", "acne"],
  },
  {
    niche: "amazon-finds",
    label: "Amazon Finds",
    keywords: ["amazon", "finds", "haul", "affiliate", "link in bio", "must have"],
  },
  {
    niche: "budget-fashion",
    label: "Budget Fashion",
    keywords: ["ootd", "outfit", "fashion", "thrift", "grwm", "style", "shein"],
  },
  {
    niche: "cafe-reels",
    label: "Café Reels",
    keywords: ["café", "cafe", "coffee", "latte", "brunch", "food reel"],
  },
  {
    niche: "college-lifestyle",
    label: "College Lifestyle",
    keywords: ["college", "campus", "study", "dorm", "university", "exam"],
  },
  {
    niche: "fitness-ugc",
    label: "Fitness UGC",
    keywords: ["gym", "workout", "fitness", "protein", "activewear"],
  },
  {
    niche: "home-decor",
    label: "Home & Decor",
    keywords: ["room", "decor", "home", "desk setup", "organization"],
  },
  {
    niche: "product-recommendations",
    label: "Product Recommendations",
    keywords: ["review", "recommend", "honest", "unboxing", "worth it"],
  },
];

export function detectNiche(text: string): {
  niche: ContentNiche;
  nicheLabel: string;
  tags: string[];
} {
  const lower = text.toLowerCase();
  let best = NICHE_RULES[NICHE_RULES.length - 1]!;
  let bestScore = 0;

  for (const rule of NICHE_RULES) {
    const score = rule.keywords.reduce(
      (s, kw) => s + (lower.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }

  const tags = best.keywords.filter((kw) => lower.includes(kw)).slice(0, 6);
  if (tags.length === 0) tags.push(best.label.toLowerCase());

  return { niche: best.niche, nicheLabel: best.label, tags };
}
