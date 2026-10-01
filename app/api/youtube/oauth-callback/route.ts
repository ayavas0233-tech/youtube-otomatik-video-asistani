import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { apiErrorResponse } from "@/lib/api-error";
import { getMissingEnvironmentVariables } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const storedState = request.cookies.get("youtube_oauth_state")?.value;

    if (!state || !storedState || state !== storedState) {
      return apiErrorResponse({
        error: "OAuth state validation failed",
        errorCode: "INVALID_OAUTH_STATE",
        statusCode: 400,
      });
    }

    const authorizationError = searchParams.get("error");
    if (authorizationError) {
      return apiErrorResponse({
        error: "YouTube authorization was denied",
        errorCode: "OAUTH_AUTHORIZATION_DENIED",
        statusCode: 400,
      });
    }

    const code = searchParams.get("code");
    if (!code) {
      return apiErrorResponse({
        error: "Authorization code is missing",
        errorCode: "MISSING_AUTHORIZATION_CODE",
        statusCode: 400,
      });
    }

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

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/youtube/oauth-callback";
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    return NextResponse.json({ ok: true, tokens });
  } catch (error) {
    return apiErrorResponse({
      error: "OAuth authorization code exchange failed",
      errorCode: "OAUTH_TOKEN_EXCHANGE_FAILED",
      statusCode: 500,
      cause: error,
    });
  }
}
