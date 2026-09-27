import { NextResponse } from "next/server";

import { getYouTubeChannelStatus } from "@/lib/youtube";

export async function GET() {
  try {
    const status = await getYouTubeChannelStatus();
    return NextResponse.json({ ok: status.ok, status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "YouTube durum kontrolü başarısız.",
      },
      { status: 500 },
    );
  }
}
