import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { getMissingEnvironmentVariables } from "@/lib/env";

export async function GET() {
  try {
    const missing = getMissingEnvironmentVariables([
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
    ]);
    if (missing.length > 0) {
      return apiErrorResponse({
        error: "Google OAuth configuration is missing",
        errorCode: "MISSING_CONFIGURATION",
        statusCode: 503,
        message: `Required environment variables are not configured: ${missing.join(", ")}`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Google OAuth hazır.",
    });
  } catch (error) {
    return apiErrorResponse({
      error: "Unable to check YouTube connection status",
      errorCode: "YOUTUBE_STATUS_FAILED",
      statusCode: 500,
      cause: error,
    });
  }
}
