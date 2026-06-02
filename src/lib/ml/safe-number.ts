/** Coerce to a finite number; otherwise return fallback. */
export function finiteOr(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/** Clamp to [min, max] after coercing non-finite values to min. */
export function clampFinite(n: number, min: number, max: number): number {
  const v = finiteOr(n, min);
  return Math.min(max, Math.max(min, v));
}

/** Integer score 0–100 for UI and models. */
export function scorePercent(n: number, fallback = 0): number {
  return Math.round(clampFinite(n, 0, 100));
}
