export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function nicheEmoji(niche: string): string {
  const map: Record<string, string> = {
    "Skincare Routines": "✦",
    "Amazon Finds": "◆",
    "Café Reels": "◇",
    "College Lifestyle": "▲",
    "Budget Fashion": "●",
    "Product Recs": "■",
  };
  return map[niche] ?? "•";
}
