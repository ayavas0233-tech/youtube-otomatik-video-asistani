import { NextResponse } from "next/server";

import { isConnected } from "@/lib/youtube-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasGoogleConfig = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const connected = hasGoogleConfig && isConnected();

  return NextResponse.json({
    ok: true,
    configured: hasGoogleConfig,
    connected,
    message: !hasGoogleConfig
      ? "Google OAuth için GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET tanımlı değil."
      : connected
        ? "YouTube hesabı bağlı."
        : "Google OAuth yapılandırıldı, henüz bir hesap bağlanmadı.",
  });
}
