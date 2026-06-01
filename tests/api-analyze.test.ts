import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/analyze/route";

vi.mock("@/lib/analyze", () => ({
  analyzeLiveCreator: vi.fn().mockResolvedValue({
    profile: { handle: "mkbhd", platform: "youtube", displayName: "MKBHD" },
    scores: { rankMint: 80 },
    modelVersion: "test",
  }),
}));

vi.mock("@/lib/session", () => ({
  getSessionId: vi.fn().mockResolvedValue("test-session"),
}));

describe("POST /api/analyze", () => {
  it("returns 400 without handle", async () => {
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ platform: "youtube" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with valid body", async () => {
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ platform: "youtube", handle: "mkbhd" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scores.rankMint).toBe(80);
  });
});
