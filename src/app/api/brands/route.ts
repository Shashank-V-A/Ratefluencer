import { createBrand, deleteBrand, listBrands } from "@/lib/brands/store";
import { getSessionId } from "@/lib/session";
import type { BrandProfile } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionId = await getSessionId();
  const brands = await listBrands(sessionId);
  return NextResponse.json({ brands });
}

export async function POST(request: Request) {
  const sessionId = await getSessionId();
  const body = await request.json().catch(() => ({}));

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
  }

  const brand = await createBrand(sessionId, {
    name,
    category: typeof body.category === "string" ? body.category.trim() : "",
    description:
      typeof body.description === "string" ? body.description.trim() : "",
    budgetTier: (["startup", "growth", "enterprise"].includes(body.budgetTier)
      ? body.budgetTier
      : "growth") as BrandProfile["budgetTier"],
    keywords: Array.isArray(body.keywords)
      ? body.keywords.filter((k: unknown) => typeof k === "string")
      : [],
  });

  if (!brand) {
    return NextResponse.json(
      { error: "Could not create brand — check Supabase configuration" },
      { status: 500 }
    );
  }

  return NextResponse.json({ brand }, { status: 201 });
}

export async function DELETE(request: Request) {
  const sessionId = await getSessionId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Brand id required" }, { status: 400 });
  }
  const ok = await deleteBrand(sessionId, id);
  if (!ok) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
