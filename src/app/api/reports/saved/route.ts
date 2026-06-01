import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSessionId } from "@/lib/session";
import type { AnalysisResult } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionId = await getSessionId();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ reports: [], supabase: false });
  }

  const { data, error } = await supabase
    .from("saved_reports")
    .select("id, platform, handle, display_name, rank_mint_score, created_at, notes")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reports: data ?? [] });
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
