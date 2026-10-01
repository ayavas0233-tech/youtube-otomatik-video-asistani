import { NextResponse } from "next/server";
import { google } from "googleapis";
import { randomBytes } from "crypto";
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

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/youtube/oauth-callback";
    const state = randomBytes(32).toString("hex");

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      include_granted_scopes: true,
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ],
      prompt: "consent",
      state,
    });

    const response = NextResponse.json({ ok: true, authUrl });
    response.cookies.set("youtube_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/youtube/oauth-callback",
      maxAge: 600,
    });
    return response;
  } catch (error) {
    return apiErrorResponse({
      error: "Unable to create YouTube authorization URL",
      errorCode: "AUTH_URL_FAILED",
      statusCode: 500,
      cause: error,
    });
  }
}
