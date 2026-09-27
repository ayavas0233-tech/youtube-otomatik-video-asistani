import { NextResponse } from "next/server";

export async function GET() {
  const hasGoogleConfig = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI,
  );

  return NextResponse.json({
    ok: hasGoogleConfig,
    message: hasGoogleConfig
      ? "Google OAuth hazır."
      : "Google OAuth için env ayarları eksik.",
  });
}
