import { NextResponse } from "next/server";

import { validateYouTubeConfig } from "@/lib/config";

export async function GET() {
  const validation = validateYouTubeConfig();

  return NextResponse.json({
    ok: validation.ok,
    status: validation.ok ? "YouTube integration ready" : "YouTube integration missing configuration",
    missing: validation.missing,
  });
}
