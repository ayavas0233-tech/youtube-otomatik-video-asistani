import { NextResponse } from "next/server";

import { validateYouTubeConfig } from "@/lib/config";

export async function GET() {
  const validation = validateYouTubeConfig();

  return NextResponse.json({
    ok: validation.ok,
    message: validation.ok ? "Google OAuth hazır." : "Google OAuth için env ayarları eksik.",
    missing: validation.missing,
  });
}
