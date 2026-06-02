import { NextResponse } from "next/server";
import { clearLinkedInOAuthSession } from "@/lib/linkedin-oauth";

export async function POST() {
  await clearLinkedInOAuthSession();
  return NextResponse.json({ ok: true });
}
