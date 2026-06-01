import { getXBearerToken } from "@/lib/env";
import { NextResponse } from "next/server";

/** Quick check that X Bearer Token is accepted by the API (no handle exposed). */
export async function GET() {
  const token = getXBearerToken();
  if (!token) {
    return NextResponse.json({
      ok: false,
      error: "X_API_BEARER_TOKEN missing in .env.local",
    });
  }

  const res = await fetch(
    "https://api.twitter.com/2/users/by/username/X?user.fields=public_metrics",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (res.ok) {
    return NextResponse.json({
      ok: true,
      message: "X Bearer Token is valid.",
    });
  }

  const body = (await res.json().catch(() => ({}))) as {
    title?: string;
    detail?: string;
  };

  if (res.status === 402 && body.title === "CreditsDepleted") {
    return NextResponse.json({
      ok: false,
      tokenValid: true,
      status: 402,
      error:
        "Bearer Token is valid, but your X account has no API credits left (pay-as-you-go). Add credits in developer.x.com → Billing, or analyze creators on YouTube.",
    });
  }

  return NextResponse.json({
    ok: false,
    status: res.status,
    error:
      res.status === 401
        ? "Bearer Token rejected (401). Regenerate OAuth 2.0 Bearer Token in developer.x.com → Keys and tokens, update .env.local, restart npm run dev."
        : body.detail || `HTTP ${res.status}`,
  });
}
