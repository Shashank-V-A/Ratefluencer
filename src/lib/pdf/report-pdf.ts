import type { AnalysisResult } from "@/lib/types";
import { tierLabel } from "@/lib/ml/creator-tier";
import { formatFollowers } from "@/lib/format";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const HEADER_H = 118;

/** Light theme — matches site orange palette */
const PAGE_BG = rgb(0.99, 0.98, 0.97);
const SURFACE = rgb(1, 1, 1);
const SURFACE_MUTED = rgb(0.97, 0.96, 0.95);
const HEADER_BG = rgb(1, 0.96, 0.92);
const BORDER = rgb(0.9, 0.87, 0.84);
const ACCENT = rgb(0.82, 0.42, 0.18);
const ACCENT_SOFT = rgb(0.96, 0.72, 0.48);
const BAR_FILL = rgb(0.91, 0.52, 0.26);
const BAR_TRACK = rgb(0.94, 0.92, 0.9);
const TEXT = rgb(0.18, 0.16, 0.15);
const MUTED = rgb(0.48, 0.45, 0.42);

type Ctx = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  contentWidth: number;
  pageIndex: number;
};

function fillPage(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PAGE_BG });
}

function drawCard(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = SURFACE
) {
  page.drawRectangle({
    x,
    y: y - h,
    width: w,
    height: h,
    color: fill,
    borderColor: BORDER,
    borderWidth: 0.75,
  });
}

async function embedAvatar(
  pdf: PDFDocument,
  url: string | undefined
): Promise<PDFImage | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const type = (res.headers.get("content-type") ?? url).toLowerCase();
    if (type.includes("png")) return pdf.embedPng(bytes);
    try {
      return await pdf.embedJpg(bytes);
    } catch {
      return pdf.embedPng(bytes);
    }
  } catch {
    return null;
  }
}

function drawAvatarPlaceholder(
  page: PDFPage,
  x: number,
  y: number,
  size: number,
  initials: string,
  bold: PDFFont
) {
  page.drawRectangle({
    x,
    y: y - size,
    width: size,
    height: size,
    color: ACCENT_SOFT,
    borderColor: BORDER,
    borderWidth: 0.75,
  });
  const t = initials.slice(0, 2).toUpperCase();
  const tw = bold.widthOfTextAtSize(t, 18);
  page.drawText(t, {
    x: x + (size - tw) / 2,
    y: y - size / 2 - 6,
    size: 18,
    font: bold,
    color: ACCENT,
  });
}

function drawPageFooter(ctx: Ctx, modelVersion: string, totalPages: number) {
  const { page, font } = ctx;
  const footerY = 32;
  const stamp =
    new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";

  page.drawLine({
    start: { x: MARGIN, y: footerY + 14 },
    end: { x: PAGE_W - MARGIN, y: footerY + 14 },
    thickness: 0.5,
    color: BORDER,
  });

  page.drawText("RankMint · Influencer Intelligence", {
    x: MARGIN,
    y: footerY,
    size: 7,
    font,
    color: MUTED,
  });

  page.drawText(`Model ${modelVersion}`, {
    x: MARGIN,
    y: footerY - 10,
    size: 7,
    font,
    color: MUTED,
  });

  const pageLabel = `Page ${ctx.pageIndex} of ${totalPages}`;
  const pw = font.widthOfTextAtSize(pageLabel, 7);
  page.drawText(pageLabel, {
    x: PAGE_W - MARGIN - pw,
    y: footerY,
    size: 7,
    font,
    color: MUTED,
  });

  const gen = `Generated ${stamp}`;
  const gw = font.widthOfTextAtSize(gen, 7);
  page.drawText(gen, {
    x: PAGE_W - MARGIN - gw,
    y: footerY - 10,
    size: 7,
    font,
    color: MUTED,
  });
}

function newPage(ctx: Ctx) {
  const page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  fillPage(page);
  ctx.page = page;
  ctx.pageIndex += 1;
  ctx.y = PAGE_H - MARGIN - 8;
}

function ensureSpace(ctx: Ctx, needed: number) {
  const floor = 56;
  if (ctx.y - needed >= floor) return;
  newPage(ctx);
}

function drawSectionTitle(ctx: Ctx, title: string, subtitle?: string) {
  ensureSpace(ctx, subtitle ? 40 : 28);
  const { page, bold, font } = ctx;

  page.drawText(title, {
    x: MARGIN,
    y: ctx.y,
    size: 13,
    font: bold,
    color: TEXT,
  });
  ctx.y -= subtitle ? 16 : 12;

  if (subtitle) {
    page.drawText(subtitle, {
      x: MARGIN,
      y: ctx.y,
      size: 8,
      font,
      color: MUTED,
    });
    ctx.y -= 14;
  }

  page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 2,
    width: 48,
    height: 2.5,
    color: ACCENT,
  });
  ctx.y -= 18;
}

function drawMetricGrid(ctx: Ctx, metrics: { label: string; value: string }[]) {
  ensureSpace(ctx, 88);
  const { page } = ctx;
  const boxH = 76;
  const yTop = ctx.y;

  drawCard(page, MARGIN, yTop, ctx.contentWidth, boxH);

  const colW = ctx.contentWidth / 2;
  const pad = 18;
  const row1Y = yTop - 28;
  const row2Y = yTop - 54;

  const drawCell = (x: number, y: number, label: string, value: string) => {
    page.drawText(label, { x, y, size: 8, font: ctx.font, color: MUTED });
    page.drawText(value, {
      x,
      y: y - 16,
      size: 14,
      font: ctx.bold,
      color: TEXT,
    });
  };

  drawCell(MARGIN + pad, row1Y, metrics[0]!.label, metrics[0]!.value);
  drawCell(MARGIN + pad + colW, row1Y, metrics[1]!.label, metrics[1]!.value);
  drawCell(MARGIN + pad, row2Y, metrics[2]!.label, metrics[2]!.value);
  drawCell(MARGIN + pad + colW, row2Y, metrics[3]!.label, metrics[3]!.value);

  ctx.y = yTop - boxH - 20;
}

function drawScoreHero(ctx: Ctx, analysis: AnalysisResult) {
  ensureSpace(ctx, 96);
  const { page, font, bold } = ctx;
  const { scores } = analysis;
  const boxH = 88;
  const yTop = ctx.y;

  drawCard(page, MARGIN, yTop, ctx.contentWidth, boxH, HEADER_BG);

  page.drawRectangle({
    x: MARGIN,
    y: yTop - boxH,
    width: 4,
    height: boxH,
    color: ACCENT,
  });

  page.drawText("RankMint™ Score", {
    x: MARGIN + 20,
    y: yTop - 28,
    size: 9,
    font,
    color: MUTED,
  });

  page.drawText(String(scores.rankMint), {
    x: MARGIN + 20,
    y: yTop - 62,
    size: 36,
    font: bold,
    color: ACCENT,
  });

  page.drawText("out of 100", {
    x: MARGIN + 20,
    y: yTop - 76,
    size: 8,
    font,
    color: MUTED,
  });

  const midX = MARGIN + ctx.contentWidth * 0.42;
  page.drawLine({
    start: { x: midX, y: yTop - 16 },
    end: { x: midX, y: yTop - boxH + 16 },
    thickness: 0.5,
    color: BORDER,
  });

  page.drawText("Campaign success estimate", {
    x: midX + 20,
    y: yTop - 28,
    size: 9,
    font,
    color: MUTED,
  });

  page.drawText(`${scores.campaignSuccessProbability}%`, {
    x: midX + 20,
    y: yTop - 58,
    size: 28,
    font: bold,
    color: TEXT,
  });

  page.drawText("Modeled from trained logistic regression", {
    x: midX + 20,
    y: yTop - 74,
    size: 7,
    font,
    color: MUTED,
  });

  ctx.y = yTop - boxH - 22;
}

function drawBarRows(
  ctx: Ctx,
  items: { label: string; value: number; max?: number }[]
) {
  const LABEL_W = 152;
  const VALUE_W = 36;
  const BAR_X = MARGIN + LABEL_W;
  const BAR_W = ctx.contentWidth - LABEL_W - VALUE_W;
  const ROW_H = 26;
  const cardPad = 14;
  const cardH = items.length * ROW_H + cardPad * 2;

  ensureSpace(ctx, cardH + 8);

  const { page, font, bold } = ctx;
  const yTop = ctx.y;
  drawCard(page, MARGIN, yTop, ctx.contentWidth, cardH, SURFACE_MUTED);

  let rowY = yTop - cardPad - 10;

  for (const item of items) {
    const max = item.max ?? 100;
    const pct = Math.min(1, Math.max(0, item.value / max));
    const barFill = Math.max(2, BAR_W * pct);

    page.drawText(item.label.slice(0, 28), {
      x: MARGIN + 12,
      y: rowY - 10,
      size: 9,
      font: bold,
      color: TEXT,
    });

    page.drawRectangle({
      x: BAR_X,
      y: rowY - 13,
      width: BAR_W,
      height: 10,
      color: BAR_TRACK,
      borderColor: BORDER,
      borderWidth: 0.25,
    });

    if (pct > 0) {
      page.drawRectangle({
        x: BAR_X,
        y: rowY - 13,
        width: barFill,
        height: 10,
        color: BAR_FILL,
      });
    }

    const valStr = String(item.value);
    const valW = bold.widthOfTextAtSize(valStr, 10);
    page.drawText(valStr, {
      x: BAR_X + BAR_W + (VALUE_W - valW) / 2,
      y: rowY - 10,
      size: 10,
      font: bold,
      color: ACCENT,
    });

    rowY -= ROW_H;
  }

  ctx.y = yTop - cardH - 16;
}

function drawBrandMatches(ctx: Ctx, analysis: AnalysisResult) {
  const seen = new Set<string>();
  const brands = analysis.brandRecommendations.filter((r) => {
    if (seen.has(r.brand.id)) return false;
    seen.add(r.brand.id);
    return true;
  });

  if (!brands.length) return;

  drawSectionTitle(
    ctx,
    "Top brand partnerships",
    "Semantic match scores from your brand catalog"
  );

  const cardH = 52;
  const gap = 10;

  for (const rec of brands.slice(0, 5)) {
    ensureSpace(ctx, cardH + gap);
    const { page, font, bold } = ctx;
    const yTop = ctx.y;

    drawCard(page, MARGIN, yTop, ctx.contentWidth, cardH);

    page.drawRectangle({
      x: MARGIN,
      y: yTop - cardH,
      width: 4,
      height: cardH,
      color: ACCENT_SOFT,
    });

    page.drawText(rec.brand.name, {
      x: MARGIN + 16,
      y: yTop - 22,
      size: 12,
      font: bold,
      color: TEXT,
    });

    page.drawText(rec.brand.category, {
      x: MARGIN + 16,
      y: yTop - 38,
      size: 9,
      font,
      color: MUTED,
    });

    const rationale = rec.rationale.slice(0, 72);
    page.drawText(
      rationale + (rec.rationale.length > 72 ? "…" : ""),
      {
        x: MARGIN + 16,
        y: yTop - 48,
        size: 7,
        font,
        color: MUTED,
      }
    );

    const scoreStr = `${rec.score}%`;
    const scoreW = bold.widthOfTextAtSize(scoreStr, 16);
    page.drawText("match", {
      x: PAGE_W - MARGIN - 16 - scoreW,
      y: yTop - 20,
      size: 7,
      font,
      color: MUTED,
    });
    page.drawText(scoreStr, {
      x: PAGE_W - MARGIN - 16 - scoreW,
      y: yTop - 38,
      size: 16,
      font: bold,
      color: ACCENT,
    });

    ctx.y = yTop - cardH - gap;
  }
}

function drawGrowthForecast(ctx: Ctx, analysis: AnalysisResult) {
  drawSectionTitle(ctx, "Growth forecast", "90-day modeled projection");
  const g = analysis.growthForecast;
  ensureSpace(ctx, 68);
  const { page, font, bold } = ctx;
  const boxH = 56;
  const yTop = ctx.y;
  const colW = ctx.contentWidth / 3;

  drawCard(page, MARGIN, yTop, ctx.contentWidth, boxH);

  const items = [
    { label: "Follower growth", value: `+${g.followerGrowth90d}%` },
    { label: "Engagement growth", value: `+${g.engagementGrowth90d}%` },
    { label: "Audience expansion", value: `+${g.audienceExpansion}%` },
  ];

  items.forEach((item, i) => {
    const x = MARGIN + 16 + i * colW;
    page.drawText(item.label, { x, y: yTop - 20, size: 8, font, color: MUTED });
    page.drawText(item.value, {
      x,
      y: yTop - 40,
      size: 16,
      font: bold,
      color: ACCENT,
    });
  });

  ctx.y = yTop - boxH - 20;
}

function drawDemographics(ctx: Ctx, analysis: AnalysisResult) {
  const d = analysis.profile.demographics;
  if (d.source === "unavailable") return;

  drawSectionTitle(
    ctx,
    "Audience demographics",
    d.source === "api" ? "From platform insights" : "Inferred from public signals"
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
      label: c.country.slice(0, 22),
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
    ensureSpace(ctx, 40);
    const g = d.genderSplit;
    const { page, font } = ctx;
    const boxH = 32;
    const yTop = ctx.y;
    drawCard(page, MARGIN, yTop, ctx.contentWidth, boxH, SURFACE_MUTED);
    page.drawText(
      `Gender estimate — Female ${g.female}% · Male ${g.male}% · Other ${g.other}%`,
      {
        x: MARGIN + 14,
        y: yTop - 20,
        size: 9,
        font,
        color: TEXT,
      }
    );
    ctx.y = yTop - boxH - 16;
  }
}

function drawAuthenticityFlags(ctx: Ctx, analysis: AnalysisResult) {
  const flags = analysis.authenticityFlags;
  const entries = [
    { key: "purchasedFollowers", label: "Purchased followers" },
    { key: "engagementPods", label: "Engagement pods" },
    { key: "botActivity", label: "Bot activity" },
    { key: "artificialSpikes", label: "Artificial spikes" },
  ] as const;

  drawSectionTitle(
    ctx,
    "Authenticity",
    `Score ${analysis.scores.authenticity} / 100`
  );

  ensureSpace(ctx, 72);
  const { page, font, bold } = ctx;
  const boxH = 64;
  const yTop = ctx.y;
  drawCard(page, MARGIN, yTop, ctx.contentWidth, boxH, SURFACE_MUTED);

  const colW = ctx.contentWidth / 2;
  entries.forEach((e, i) => {
    const risk = flags[e.key];
    const x = MARGIN + 14 + (i % 2) * colW;
    const y = yTop - 22 - Math.floor(i / 2) * 22;
    const riskColor =
      risk === "high"
        ? rgb(0.75, 0.22, 0.18)
        : risk === "medium"
          ? rgb(0.75, 0.5, 0.15)
          : rgb(0.35, 0.55, 0.35);
    page.drawText(e.label, { x, y, size: 8, font, color: MUTED });
    const riskW = bold.widthOfTextAtSize(risk, 9);
    page.drawText(risk, {
      x: x + 120,
      y,
      size: 9,
      font: bold,
      color: riskColor,
    });
  });

  ctx.y = yTop - boxH - 20;
}

function drawScoreTransparency(ctx: Ctx, analysis: AnalysisResult) {
  const exp = analysis.explainability;
  if (!exp) return;
  drawSectionTitle(
    ctx,
    "Score transparency",
    `Confidence ${analysis.meta?.confidence ?? exp.rankMint.confidence}% · Sample size ${analysis.meta?.sampleSize ?? exp.rankMint.sampleSize}`
  );
  const rows = [
    ["RankMint", exp.rankMint.summary],
    ["Authenticity", exp.authenticity.summary],
    ["Growth", exp.growthPotential.summary],
    ["Brand match", exp.brandMatch.summary],
  ] as const;
  for (const [label, summary] of rows) {
    ensureSpace(ctx, 30);
    drawCard(ctx.page, MARGIN, ctx.y, ctx.contentWidth, 24, SURFACE_MUTED);
    ctx.page.drawText(label, {
      x: MARGIN + 10,
      y: ctx.y - 15,
      size: 8,
      font: ctx.bold,
      color: TEXT,
    });
    ctx.page.drawText(summary.slice(0, 85), {
      x: MARGIN + 96,
      y: ctx.y - 15,
      size: 8,
      font: ctx.font,
      color: MUTED,
    });
    ctx.y -= 30;
  }
}

async function drawHeader(
  ctx: Ctx,
  analysis: AnalysisResult,
  avatar: PDFImage | null
) {
  const { page, font, bold } = ctx;
  const { profile } = analysis;
  const tier = analysis.creatorTier ?? "mid";
  const AVATAR = 64;
  const avatarX = MARGIN + 20;
  const avatarY = PAGE_H - 24;

  page.drawRectangle({
    x: 0,
    y: PAGE_H - HEADER_H,
    width: PAGE_W,
    height: HEADER_H,
    color: HEADER_BG,
  });

  page.drawRectangle({
    x: 0,
    y: PAGE_H - HEADER_H,
    width: PAGE_W,
    height: 3,
    color: ACCENT,
  });

  if (avatar) {
    const scale = AVATAR / Math.max(avatar.width, avatar.height);
    const w = avatar.width * scale;
    const h = avatar.height * scale;
    page.drawImage(avatar, {
      x: avatarX + (AVATAR - w) / 2,
      y: avatarY - AVATAR + (AVATAR - h) / 2,
      width: w,
      height: h,
    });
    page.drawRectangle({
      x: avatarX - 1,
      y: avatarY - AVATAR - 1,
      width: AVATAR + 2,
      height: AVATAR + 2,
      borderColor: BORDER,
      borderWidth: 1,
    });
  } else {
    const initials = profile.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
    drawAvatarPlaceholder(page, avatarX, avatarY, AVATAR, initials, bold);
  }

  const textX = avatarX + AVATAR + 18;
  page.drawText("RankMint", {
    x: textX,
    y: PAGE_H - 36,
    size: 10,
    font: bold,
    color: ACCENT,
  });
  page.drawText("Intelligence Report", {
    x: textX,
    y: PAGE_H - 50,
    size: 8,
    font,
    color: MUTED,
  });

  const nameSize = profile.displayName.length > 22 ? 16 : 20;
  page.drawText(profile.displayName, {
    x: textX,
    y: PAGE_H - 74,
    size: nameSize,
    font: bold,
    color: TEXT,
  });

  page.drawText(
    `@${profile.handle}  ·  ${profile.platform}  ·  ${tierLabel(tier)}`,
    {
      x: textX,
      y: PAGE_H - 92,
      size: 9,
      font,
      color: MUTED,
    }
  );

  const badge = "LIVE API DATA";
  const bw = bold.widthOfTextAtSize(badge, 7);
  page.drawRectangle({
    x: PAGE_W - MARGIN - bw - 16,
    y: PAGE_H - 44,
    width: bw + 16,
    height: 18,
    color: SURFACE,
    borderColor: ACCENT,
    borderWidth: 0.5,
  });
  page.drawText(badge, {
    x: PAGE_W - MARGIN - bw - 8,
    y: PAGE_H - 40,
    size: 7,
    font: bold,
    color: ACCENT,
  });

  ctx.y = PAGE_H - HEADER_H - 24;
}

export async function buildReportPdf(
  analysis: AnalysisResult
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const avatar = await embedAvatar(pdf, analysis.meta?.avatarUrl);

  const page = pdf.addPage([PAGE_W, PAGE_H]);
  fillPage(page);

  const ctx: Ctx = {
    pdf,
    page,
    font,
    bold,
    y: PAGE_H - MARGIN,
    contentWidth: PAGE_W - MARGIN * 2,
    pageIndex: 1,
  };

  await drawHeader(ctx, analysis, avatar);

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

  drawScoreHero(ctx, analysis);

  drawSectionTitle(ctx, "Score breakdown", "Four core engines");
  drawBarRows(ctx, [
    { label: "Authenticity", value: analysis.scores.authenticity },
    { label: "Growth potential", value: analysis.scores.growthPotential },
    { label: "Brand match", value: analysis.scores.brandMatch },
    {
      label: "Campaign success",
      value: analysis.scores.campaignSuccessProbability,
    },
  ]);

  drawSectionTitle(
    ctx,
    "ML feature importance",
    analysis.modelVersion
  );
  drawBarRows(
    ctx,
    analysis.featureImportance.map((f) => ({
      label: f.feature,
      value: f.impact,
    }))
  );

  drawScoreTransparency(ctx, analysis);
  drawAuthenticityFlags(ctx, analysis);
  drawGrowthForecast(ctx, analysis);
  drawDemographics(ctx, analysis);
  drawBrandMatches(ctx, analysis);

  const totalPages = pdf.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdf.getPage(i);
    const pageCtx: Ctx = {
      ...ctx,
      page: p,
      pageIndex: i + 1,
    };
    drawPageFooter(pageCtx, analysis.modelVersion, totalPages);
  }

  return pdf.save();
}
