#!/usr/bin/env node
/** Verify Supabase env + tables. Run: node scripts/verify-supabase.mjs */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = ["analysis_cache", "brands", "saved_reports", "shortlists"];
let ok = true;

for (const table of tables) {
  const { error } = await sb.from(table).select("id", { count: "exact", head: true });
  if (error) {
    console.error(`✗ ${table}:`, error.message);
    ok = false;
  } else {
    console.log(`✓ ${table}`);
  }
}

const { error: rpcErr } = await sb.rpc("match_brands_by_embedding", {
  query_embedding: new Array(1536).fill(0),
  match_session_id: "verify",
  match_count: 1,
});
if (rpcErr) {
  console.error("✗ match_brands_by_embedding:", rpcErr.message);
  ok = false;
} else {
  console.log("✓ match_brands_by_embedding RPC");
}

console.log(ok ? "\nSupabase setup OK" : "\nFix errors above (re-run supabase/setup.sql if tables missing)");
process.exit(ok ? 0 : 1);
