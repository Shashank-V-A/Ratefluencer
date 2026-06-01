import { analyzeLiveCreator, decodeLiveReportId } from "@/lib/analyze";
import { analyzeCreatorById } from "@/lib/analyze";
import { PlatformApiError } from "@/lib/platforms";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const live = decodeLiveReportId(id);
  if (live) {
    try {
      const result = await analyzeLiveCreator(live.platform, live.handle);
      return NextResponse.json(result);
    } catch (e) {
      if (e instanceof PlatformApiError) {
        return NextResponse.json(
          { error: e.message, code: e.code, hint: e.hint },
          { status: e.status ?? 502 }
        );
      }
      throw e;
    }
  }

  const demo = analyzeCreatorById(id);
  if (!demo) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json(demo);
}
