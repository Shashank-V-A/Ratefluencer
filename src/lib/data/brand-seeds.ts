import type { BrandProfile } from "@/lib/types";

/** Default brand catalog seeded into each workspace on first use */
export const brandDefs: Omit<BrandProfile, "embedding">[] = [
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
