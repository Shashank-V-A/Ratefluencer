import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSessionId } from "@/lib/session";
import type { AnalysisResult } from "@/lib/types";
import { NextResponse } from "next/server";

const DEFAULT_AVATAR_GRADIENT =
  "from-orange-400 via-amber-300 to-orange-200";

function avatarFromAnalysis(
  analysis: unknown,
  handle: string
): { avatarUrl?: string; avatarGradient: string } {
  const a = analysis as AnalysisResult | null;
  if (a?.profile?.avatarGradient) {
    return {
      avatarUrl: a.meta?.avatarUrl,
      avatarGradient: a.profile.avatarGradient,
    };
  }
  const gradients = [
    "from-rose-400 via-orange-300 to-amber-200",
    "from-amber-300 via-orange-200 to-yellow-100",
    "from-indigo-400 via-violet-400 to-fuchsia-300",
    "from-orange-400 via-amber-300 to-orange-200",
    "from-fuchsia-500 via-pink-400 to-rose-300",
  ];
  let h = 0;
  for (let i = 0; i < handle.length; i++) h += handle.charCodeAt(i);
  return {
    avatarUrl: a?.meta?.avatarUrl,
    avatarGradient: gradients[h % gradients.length] ?? DEFAULT_AVATAR_GRADIENT,
  };
}

export async function GET() {
  const sessionId = await getSessionId();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ reports: [], supabase: false });
  }

  const { data, error } = await supabase
    .from("saved_reports")
    .select(
      "id, platform, handle, display_name, rank_mint_score, created_at, notes, analysis"
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reports = (data ?? []).map((row) => {
    const { avatarUrl, avatarGradient } = avatarFromAnalysis(
      row.analysis,
      row.handle
    );
    return {
      id: row.id,
      platform: row.platform,
      handle: row.handle,
      display_name: row.display_name,
      rank_mint_score: row.rank_mint_score,
      created_at: row.created_at,
      notes: row.notes,
      avatar_url: avatarUrl ?? null,
      avatar_gradient: avatarGradient,
    };
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const sessionId = await getSessionId();
  const body = await request.json().catch(() => ({}));
  const analysis = body.analysis as AnalysisResult | undefined;

  if (!analysis?.profile) {
    return NextResponse.json(
      { error: "analysis object required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        error: "Saved reports require Supabase — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("saved_reports")
    .insert({
      session_id: sessionId,
      platform: analysis.profile.platform,
      handle: analysis.profile.handle,
      display_name: analysis.profile.displayName,
      rank_mint_score: analysis.scores.rankMint,
      analysis,
      notes: typeof body.notes === "string" ? body.notes : null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const sessionId = await getSessionId();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { error } = await supabase
    .from("saved_reports")
    .delete()
    .eq("id", id)
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
