import fs from "fs";
import path from "path";

const root = process.cwd();
const localPath = path.join(root, ".env.local");
const examplePath = path.join(root, ".env.example");

function parseEnv(content) {
  const keys = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    keys[key] = value;
  }
  return keys;
}

if (!fs.existsSync(localPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, localPath);
    console.log("\n✓ Created .env.local from .env.example");
    console.log("  → Open .env.local and paste your YouTube + X API keys");
    console.log("  → Then restart: npm run dev\n");
  } else {
    console.warn("\n⚠ Missing .env.example — cannot create .env.local\n");
  }
} else {
  const vars = parseEnv(fs.readFileSync(localPath, "utf8"));
  const missing = [];
  if (!vars.YOUTUBE_API_KEY) missing.push("YOUTUBE_API_KEY");
  if (!vars.X_API_BEARER_TOKEN && !vars.TWITTER_BEARER_TOKEN) {
    missing.push("X_API_BEARER_TOKEN");
  }
  if (missing.length) {
    console.log("\n⚠ .env.local exists but missing:", missing.join(", "));
    console.log("  → Add keys from Google Cloud / developer.x.com, then restart dev\n");
  }
}
