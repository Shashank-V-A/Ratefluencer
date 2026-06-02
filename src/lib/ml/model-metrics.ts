import fs from "node:fs";
import path from "node:path";

type TrainingMeta = {
  dataset?: string;
  rows?: number;
  testAccuracy?: number;
  auc?: number;
  f1?: number;
  trainedAt?: string;
};

let cached: TrainingMeta | null = null;

export function getModelMetrics() {
  if (cached) return cached;
  try {
    const metaPath = path.join(process.cwd(), "ml", "training_meta.json");
    if (!fs.existsSync(metaPath)) return null;
    const data = JSON.parse(fs.readFileSync(metaPath, "utf8")) as TrainingMeta;
    cached = data;
    return data;
  } catch {
    return null;
  }
}
