import type { BrandProfile } from "@/lib/types";

/** Optional starter catalog — add your own brands in /brands */
export const brandDefs: Omit<BrandProfile, "embedding">[] = [
  {
    id: "dbrand",
    name: "dbrand",
    category: "Tech Accessories",
    description:
      "Premium skins and cases for phones and laptops. Partners with tech reviewers and gadget channels.",
    budgetTier: "growth",
    keywords: ["iphone", "macbook", "tech", "gadget", "review", "unboxing"],
  },
  {
    id: "notion",
    name: "Notion",
    category: "SaaS / Productivity",
    description:
      "All-in-one workspace app. Sponsors productivity and student creator workflows.",
    budgetTier: "enterprise",
    keywords: ["notion", "productivity", "workflow", "student", "setup"],
  },
  {
    id: "samsung",
    name: "Samsung Mobile",
    category: "Consumer Tech",
    description:
      "Smartphones and ecosystem devices. Long-form reviews and camera comparisons.",
    budgetTier: "enterprise",
    keywords: ["samsung", "galaxy", "android", "smartphone", "camera test"],
  },
  {
    id: "anker",
    name: "Anker",
    category: "Consumer Electronics",
    description:
      "Chargers, power banks, and desk gear. Tech YouTubers and desk-setup creators.",
    budgetTier: "growth",
    keywords: ["anker", "charger", "desk setup", "tech", "battery"],
  },
  {
    id: "nothing",
    name: "Nothing",
    category: "Consumer Tech",
    description:
      "Design-led consumer tech brand. Aesthetic tech reviews and lifestyle crossover.",
    budgetTier: "growth",
    keywords: ["nothing phone", "tech", "design", "review", "android"],
  },
];

/** Removed demo UGC/commerce seeds — purged from existing workspaces on load */
export const legacyDemoBrandNames = [
  "Glowlane Skincare",
  "CartDrop",
  "Campus Brew Co.",
  "Threadline",
  "NestBox Home",
  "PulseFit",
] as const;
