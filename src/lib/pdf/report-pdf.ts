import type { AnalysisResult } from "@/lib/types";
import { tierLabel } from "@/lib/ml/creator-tier";
import { formatFollowers } from "@/lib/format";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;

/** Match site theme: black + radium green */
const BG = rgb(0.03, 0.05, 0.04);
const HEADER = rgb(0.05, 0.08, 0.06);
const CARD = rgb(0.07, 0.1, 0.08);
const TRACK = rgb(0.12, 0.16, 0.13);
const RADIUM = rgb(0.72, 0.96, 0.38);
const TEXT = rgb(0.94, 0.97, 0.92);
const MUTED = rgb(0.62, 0.7, 0.64);
const BORDER = rgb(0.72, 0.96, 0.38);

type Ctx = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  contentWidth: number;
};

function fillPage(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed >= MARGIN) return;
  const page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  fillPage(page);
  ctx.page = page;
  ctx.y = PAGE_H - MARGIN;
}

function drawSectionTitle(ctx: Ctx, title: string) {
  ensureSpace(ctx, 28);
  const { page, bold, y } = ctx;
  page.drawText(title, {
    x: MARGIN,
    y: ctx.y,
    size: 12,
    font: bold,
    color: TEXT,
  });
  ctx.y = y - 6;
  page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + ctx.contentWidth, y: ctx.y },
    thickness: 0.5,
    color: BORDER,
  });
  ctx.y -= 18;
}

function drawLabelValue(
  ctx: Ctx,
  x: number,
  y: number,
  label: string,
  value: string,
  valueSize = 13
) {
  const { page, font, bold } = ctx;
  page.drawText(label, { x, y, size: 8, font, color: MUTED });
  page.drawText(value, {
    x,
    y: y - 15,
    size: valueSize,
    font: bold,
    color: TEXT,
  });
}

function drawMetricGrid(
  ctx: Ctx,
  metrics: { label: string; value: string }[]
) {
  ensureSpace(ctx, 72);
  const { page } = ctx;
  const boxH = 68;
  const yTop = ctx.y;

  page.drawRectangle({
    x: MARGIN,
    y: yTop - boxH,
    width: ctx.contentWidth,
    height: boxH,
    color: CARD,
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  const colW = ctx.contentWidth / 2;
  const row1Y = yTop - 22;
  const row2Y = yTop - 48;

  drawLabelValue(ctx, MARGIN + 14, row1Y, metrics[0]!.label, metrics[0]!.value);
  drawLabelValue(
    ctx,
    MARGIN + 14 + colW,
    row1Y,
    metrics[1]!.label,
    metrics[1]!.value
  );
  drawLabelValue(ctx, MARGIN + 14, row2Y, metrics[2]!.label, metrics[2]!.value);
  drawLabelValue(
    ctx,
    MARGIN + 14 + colW,
    row2Y,
    metrics[3]!.label,
    metrics[3]!.value
  );

  ctx.y = yTop - boxH - 20;
}

function drawBarRows(
  ctx: Ctx,
  items: { label: string; value: number; max?: number }[]
) {
  const LABEL_W = 148;
  const VALUE_W = 32;
  const BAR_X = MARGIN + LABEL_W;
  const BAR_W = ctx.contentWidth - LABEL_W - VALUE_W;
  const ROW_H = 24;
  const needed = items.length * ROW_H + 8;

  ensureSpace(ctx, needed);

  const { page, font, bold } = ctx;

  for (const item of items) {
    const max = item.max ?? 100;
    const pct = Math.min(1, Math.max(0, item.value / max));
    const barFill = BAR_W * pct;
    const rowY = ctx.y;

    page.drawText(item.label.slice(0, 26), {
      x: MARGIN,
      y: rowY - 11,
      size: 9,
      font,
      color: MUTED,
    });

    page.drawRectangle({
      x: BAR_X,
      y: rowY - 14,
      width: BAR_W,
      height: 11,
      color: TRACK,
    });

    if (barFill > 0) {
      page.drawRectangle({
        x: BAR_X,
        y: rowY - 14,
        width: barFill,
        height: 11,
        color: RADIUM,
      });
    }

    const valStr =
      max === 100 && item.label.includes("%")
        ? `${item.value}%`
        : String(item.value);
    const valX = BAR_X + BAR_W + 8;
    page.drawText(valStr, {
      x: valX,
      y: rowY - 11,
      size: 9,
      font: bold,
      color: TEXT,
    });

    ctx.y -= ROW_H;
  }

  ctx.y -= 8;
}

function drawHeader(ctx: Ctx, analysis: AnalysisResult) {
  const { page, font, bold } = ctx;
  const { profile } = analysis;
  const tier = analysis.creatorTier ?? "mid";

  page.drawRectangle({
    x: 0,
    y: PAGE_H - 88,
    width: PAGE_W,
    height: 88,
    color: HEADER,
  });

  page.drawLine({
    start: { x: 0, y: PAGE_H - 88 },
    end: { x: PAGE_W, y: PAGE_H - 88 },
    thickness: 1,
    color: BORDER,
  });

  page.drawText("RankMint Intelligence Report", {
    x: MARGIN,
    y: PAGE_H - 38,
    size: 18,
    font: bold,
    color: RADIUM,
  });

  page.drawText(
    `${profile.displayName}  ·  @${profile.handle}  ·  ${profile.platform}`,
    {
      x: MARGIN,
      y: PAGE_H - 58,
      size: 10,
      font,
      color: TEXT,
    }
  );

  page.drawText(tierLabel(tier), {
    x: MARGIN,
    y: PAGE_H - 74,
    size: 9,
    font: bold,
    color: MUTED,
  });

  ctx.y = PAGE_H - 108;
}

function drawRankMintHero(ctx: Ctx, analysis: AnalysisResult) {
  const { scores } = analysis;
  ensureSpace(ctx, 78);
  const { page, font, bold } = ctx;
  const boxH = 64;
  const yTop = ctx.y;

  page.drawRectangle({
    x: MARGIN,
    y: yTop - boxH,
    width: ctx.contentWidth,
    height: boxH,
    color: CARD,
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  page.drawText("RankMint™", {
    x: MARGIN + 16,
    y: yTop - 26,
    size: 10,
    font,
    color: MUTED,
  });

  page.drawText(String(scores.rankMint), {
    x: MARGIN + 16,
    y: yTop - 50,
    size: 28,
    font: bold,
    color: RADIUM,
  });

  page.drawText("Campaign success estimate", {
    x: MARGIN + 120,
    y: yTop - 26,
    size: 9,
    font,
    color: MUTED,
  });

  page.drawText(`${scores.campaignSuccessProbability}%`, {
    x: MARGIN + 120,
    y: yTop - 48,
    size: 20,
    font: bold,
    color: TEXT,
  });

  if (
    analysis.rawRankMint != null &&
    analysis.rawRankMint !== scores.rankMint
  ) {
    page.drawText(`Uncalibrated model: ${analysis.rawRankMint}`, {
      x: MARGIN + 280,
      y: yTop - 40,
      size: 8,
      font,
      color: MUTED,
    });
  }

  ctx.y = yTop - boxH - 22;
}

function drawGrowthForecast(ctx: Ctx, analysis: AnalysisResult) {
  drawSectionTitle(ctx, "Growth forecast (90 days, modeled)");
  const g = analysis.growthForecast;
  ensureSpace(ctx, 56);
  const { page, font, bold } = ctx;
  const boxH = 48;
  const yTop = ctx.y;
  const colW = ctx.contentWidth / 3;

  page.drawRectangle({
    x: MARGIN,
    y: yTop - boxH,
    width: ctx.contentWidth,
    height: boxH,
    color: CARD,
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  const items = [
    { label: "Follower growth", value: `+${g.followerGrowth90d}%` },
    { label: "Engagement growth", value: `+${g.engagementGrowth90d}%` },
    { label: "Audience expansion", value: `+${g.audienceExpansion}%` },
  ];

  items.forEach((item, i) => {
    const x = MARGIN + 14 + i * colW;
    page.drawText(item.label, { x, y: yTop - 18, size: 8, font, color: MUTED });
    page.drawText(item.value, {
      x,
      y: yTop - 36,
      size: 14,
      font: bold,
      color: RADIUM,
    });
  });

  ctx.y = yTop - boxH - 20;
}

function drawBrandMatches(ctx: Ctx, analysis: AnalysisResult) {
  const seen = new Set<string>();
  const brands = analysis.brandRecommendations.filter((r) => {
    if (seen.has(r.brand.id)) return false;
    seen.add(r.brand.id);
    return true;
  });

  if (!brands.length) return;

  drawSectionTitle(ctx, "Top brand matches");
  ensureSpace(ctx, brands.length * 18 + 8);
  const { page, font, bold } = ctx;

  for (const rec of brands.slice(0, 5)) {
    page.drawText(rec.brand.name, {
      x: MARGIN,
      y: ctx.y - 10,
      size: 10,
      font: bold,
      color: TEXT,
    });
    const scoreStr = `${rec.score}%`;
    const scoreW = bold.widthOfTextAtSize(scoreStr, 10);
    page.drawText(scoreStr, {
      x: MARGIN + ctx.contentWidth - scoreW,
      y: ctx.y - 10,
      size: 10,
      font: bold,
      color: RADIUM,
    });
    page.drawText(rec.brand.category, {
      x: MARGIN + 160,
      y: ctx.y - 10,
      size: 9,
      font,
      color: MUTED,
    });
    ctx.y -= 18;
  }

  ctx.y -= 8;
}

function drawFooter(ctx: Ctx, modelVersion: string) {
  ensureSpace(ctx, 36);
  const { page, font } = ctx;
  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";

  page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + ctx.contentWidth, y: ctx.y },
    thickness: 0.5,
    color: TRACK,
  });
  ctx.y -= 14;

  page.drawText(`Model: ${modelVersion}`, {
    x: MARGIN,
    y: ctx.y,
    size: 8,
    font,
    color: MUTED,
  });
  page.drawText(`Generated ${stamp}`, {
    x: MARGIN,
    y: ctx.y - 11,
    size: 8,
    font,
    color: MUTED,
  });
}

function drawDemographics(ctx: Ctx, analysis: AnalysisResult) {
  const d = analysis.profile.demographics;
  if (d.source === "unavailable") return;

  drawSectionTitle(
    ctx,
    d.source === "api"
      ? "Audience demographics (platform API)"
      : "Audience demographics (inferred)"
  );

  const ageItems =
    d.ageGroups?.slice(0, 4).map((g) => ({
      label: g.range,
      value: g.percent,
    })) ?? [];

  if (ageItems.length) {
    ensureSpace(ctx, 20);
    ctx.page.drawText("Age distribution", {
      x: MARGIN,
      y: ctx.y,
      size: 9,
      font: ctx.bold,
      color: MUTED,
    });
    ctx.y -= 14;
    drawBarRows(ctx, ageItems);
  }

  const countryItems =
    d.topCountries?.slice(0, 4).map((c) => ({
      label: c.country.slice(0, 20),
      value: c.percent,
    })) ?? [];

  if (countryItems.length) {
    ensureSpace(ctx, 20);
    ctx.page.drawText("Top countries", {
      x: MARGIN,
      y: ctx.y,
      size: 9,
      font: ctx.bold,
      color: MUTED,
    });
    ctx.y -= 14;
    drawBarRows(ctx, countryItems);
  }

  if (d.genderSplit) {
    ensureSpace(ctx, 36);
    const g = d.genderSplit;
    ctx.page.drawText(
      `Gender (est.): Female ${g.female}% · Male ${g.male}% · Other ${g.other}%`,
      { x: MARGIN, y: ctx.y - 10, size: 8, font: ctx.font, color: TEXT }
    );
    ctx.y -= 24;
  }
}

export async function buildReportPdf(
  analysis: AnalysisResult
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([PAGE_W, PAGE_H]);
  fillPage(page);

  const ctx: Ctx = {
    pdf,
    page,
    font,
    bold,
    y: PAGE_H - MARGIN,
    contentWidth: PAGE_W - MARGIN * 2,
  };

  drawHeader(ctx, analysis);

  const m = analysis.profile.metrics;
  const engagementRate =
    ((m.likes + m.comments + m.shares + m.saves) / Math.max(m.followers, 1)) *
    100;

  drawMetricGrid(ctx, [
    { label: "Followers", value: formatFollowers(m.followers) },
    { label: "Engagement rate", value: `${engagementRate.toFixed(2)}%` },
    { label: "Avg views", value: formatFollowers(m.avgReelViews) },
    { label: "Posts / 30 days", value: String(m.postsLast30Days) },
  ]);

  drawRankMintHero(ctx, analysis);

  drawSectionTitle(ctx, "Score breakdown");
  drawBarRows(ctx, [
    { label: "Authenticity", value: analysis.scores.authenticity },
    { label: "Growth potential", value: analysis.scores.growthPotential },
    { label: "Brand match", value: analysis.scores.brandMatch },
    {
      label: "Campaign success",
      value: analysis.scores.campaignSuccessProbability,
    },
  ]);

  drawSectionTitle(ctx, "ML feature importance");
  drawBarRows(
    ctx,
    analysis.featureImportance.map((f) => ({
      label: f.feature,
      value: f.impact,
    }))
  );

  drawGrowthForecast(ctx, analysis);
  drawDemographics(ctx, analysis);
  drawBrandMatches(ctx, analysis);
  drawFooter(ctx, analysis.modelVersion);

  return pdf.save();
}
