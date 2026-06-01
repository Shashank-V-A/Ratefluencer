import { getAllPlatformStatus } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    platforms: getAllPlatformStatus(),
    docs: "/settings",
  });
}
