import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // YouTube bağlantı durumunu kontrol et
    const token = req.cookies.get("youtube_access_token");

    if (!token) {
      return NextResponse.json({ ok: false, connected: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true, connected: true }, { status: 200 });
  } catch (error) {
    console.error("YouTube validate error:", error);
    return NextResponse.json(
      { ok: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
