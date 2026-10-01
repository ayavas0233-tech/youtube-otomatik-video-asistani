import { NextResponse } from "next/server";

import { buildAuthUrl } from "@/lib/youtube-client";
import { generateState, setStateCookie } from "@/lib/oauth-state-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = generateState();
    const authUrl = buildAuthUrl(state);
    await setStateCookie(state);

    return NextResponse.json({ ok: true, authUrl });
  } catch (error) {
    console.error("Auth URL oluşturma hatası:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Google OAuth URL'si oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
