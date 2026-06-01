#!/usr/bin/env node
/** Sync ml/exported_coefficients.json → src/lib/ml/coefficients.ts */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const jsonPath = path.join(root, "ml", "exported_coefficients.json");
const outPath = path.join(root, "src", "lib", "ml", "coefficients.ts");

const coefs = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const lines = Object.entries(coefs).map(
  ([k, v]) => `  ${k}: ${Number(v).toFixed(6)},`
);

const content = `/**
 * Logistic-regression coefficients exported from ml/train_model.py
 * (synthetic micro-UGC campaign labels, documented in ml/train_model.py).
 * Regenerate: python ml/train_model.py && npm run ml:sync
 */
export const RANK_MINT_COEFFICIENTS = {
${lines.join("\n")}
} as const;

export const FEATURE_LABELS: Record<keyof typeof RANK_MINT_COEFFICIENTS, string> = {
  intercept: "Baseline",
  engagementRate: "Engagement Rate",
  shareRate: "Share Rate",
  saveRate: "Save Rate",
  commentRate: "Comment Quality Signal",
  viewToFollowerRatio: "Reel Reach Ratio",
  postingConsistency: "Posting Consistency",
  growthRate30d: "30d Growth Momentum",
  audienceQuality: "Audience Quality",
  commentQuality: "Comment Authenticity",
  contentCategoryFit: "Commerce Content Fit",
  demographicMatch: "Demographic Alignment",
  authenticityRaw: "Trust Signals",
  microCreatorBonus: "Micro-UGC Fit",
};

export const MODEL_VERSION = "rm-trained-v1.0-synthetic";
`;

fs.writeFileSync(outPath, content);
console.log("Wrote", outPath);
