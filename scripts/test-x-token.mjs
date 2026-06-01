import fs from "fs";
import path from "path";

function loadToken() {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("X_API_BEARER_TOKEN=")) continue;
    let v = t.slice("X_API_BEARER_TOKEN=".length).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (v.toLowerCase().startsWith("bearer ")) v = v.slice(7).trim();
    if (v.includes("%")) {
      try {
        v = decodeURIComponent(v);
      } catch {
        /* keep */
      }
    }
    return v;
  }
  return null;
}

const token = loadToken();
if (!token) {
  console.error("No X_API_BEARER_TOKEN in .env.local");
  process.exit(1);
}

console.log("Token length:", token.length);

for (const base of ["https://api.twitter.com/2", "https://api.x.com/2"]) {
  const url = `${base}/users/by/username/naval?user.fields=public_metrics`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  console.log("\n", base, "→", res.status, body.slice(0, 200));
}
