import { NextResponse } from "next/server";
import { clearYouTubeOAuthSession } from "@/lib/youtube-oauth";

export async function POST() {
  await clearYouTubeOAuthSession();
  return NextResponse.json({ ok: true });
}
