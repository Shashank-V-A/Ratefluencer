import { analyzeCreatorById } from "@/lib/analyze";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = analyzeCreatorById(id);
  if (!result) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
