import { analyzeLiveCreator, decodeLiveReportId } from "@/lib/analyze";
import { buildReportPdf } from "@/lib/pdf/report-pdf";
import { getSessionId } from "@/lib/session";
import { PlatformApiError } from "@/lib/platforms";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const live = decodeLiveReportId(id);
  if (!live) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 404 });
  }

  try {
    const sessionId = await getSessionId();
    const analysis = await analyzeLiveCreator(live.platform, live.handle, {
      sessionId,
    });
    const bytes = await buildReportPdf(analysis);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rankmint-${live.handle}.pdf"`,
      },
    });
  } catch (e) {
    if (e instanceof PlatformApiError) {
      return NextResponse.json(
        { error: e.message, hint: e.hint },
        { status: e.status ?? 502 }
      );
    }
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
