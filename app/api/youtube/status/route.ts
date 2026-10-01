import { NextResponse } from "next/server";
import { getRedirectUri } from "@/lib/oauth-utils";

export async function GET() {
  const hasGoogleConfig = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && getRedirectUri(),
  );

  return NextResponse.json({
    ok: hasGoogleConfig,
    message: hasGoogleConfig ? "Google OAuth hazır." : "Google OAuth için env ayarları eksik.",
  });
}
