import { analyzeLiveCreator, decodeLiveReportId } from "@/lib/analyze";
import { getSessionId } from "@/lib/session";
import { PlatformApiError } from "@/lib/platforms";
import type { AnalysisResult } from "@/lib/types";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

async function loadAnalysis(id: string): Promise<AnalysisResult | null> {
  const live = decodeLiveReportId(id);
  if (!live) return null;
  const sessionId = await getSessionId();
  return analyzeLiveCreator(live.platform, live.handle, { sessionId });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const analysis = await loadAnalysis(id);
    if (!analysis) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const { profile, scores, modelVersion } = analysis;
    let y = 740;

    const line = (text: string, size = 11, f = font) => {
      page.drawText(text.slice(0, 90), { x: 48, y, size, font: f, color: rgb(0.1, 0.1, 0.12) });
      y -= size + 6;
    };

    line("RankMint Intelligence Report", 18, bold);
    line(`${profile.displayName} (@${profile.handle}) · ${profile.platform}`, 12);
    line(`RankMint™ ${scores.rankMint} · Campaign success ${scores.campaignSuccessProbability}%`, 12, bold);
    y -= 8;
    line(`Authenticity ${scores.authenticity} · Growth ${scores.growthPotential} · Brand match ${scores.brandMatch}`, 10);
    line(`Model ${modelVersion}`, 9);
    if (analysis.meta?.scoringNotes?.length) {
      y -= 4;
      line("Notes:", 10, bold);
      for (const note of analysis.meta.scoringNotes.slice(0, 4)) {
        line(`• ${note}`, 9);
      }
    }
    line(`Generated ${new Date().toISOString()}`, 8);

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rankmint-${profile.handle}.pdf"`,
      },
    });
  } catch (e) {
    if (e instanceof PlatformApiError) {
      return NextResponse.json({ error: e.message, hint: e.hint }, { status: e.status ?? 502 });
    }
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
