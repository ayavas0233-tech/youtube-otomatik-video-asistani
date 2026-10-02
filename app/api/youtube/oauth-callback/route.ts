import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { saveYouTubeTokens } from "@/lib/youtube-token";

const STATE_COOKIE_NAME = "oauth_state";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Check for OAuth errors from Google
  if (error) {
    console.error("OAuth error from Google:", error, errorDescription);
    return NextResponse.json(
      {
        ok: false,
        message: `OAuth authorization failed: ${error}`,
        details: errorDescription,
      },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { ok: false, message: "Authorization code not found" },
      { status: 400 },
    );
  }

  if (!state) {
    return NextResponse.json(
      { ok: false, message: "State parameter missing" },
      { status: 400 },
    );
  }

  // Validate state from cookie
  const storedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
  if (!storedState || storedState !== state) {
    console.error("State mismatch:", { received: state, stored: storedState });
    return NextResponse.json(
      {
        ok: false,
        message: "OAuth state validation failed. Security check rejected request.",
      },
      { status: 403 },
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/youtube/oauth-callback";

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, message: "Google OAuth environment not configured" },
      { status: 500 },
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    // Validate tokens
    if (!tokens.access_token) {
      throw new Error("No access token received from Google");
    }

    // Save tokens securely (encrypted)
    await saveYouTubeTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? undefined,
      expiry_date: tokens.expiry_date ?? undefined,
      token_type: tokens.token_type ?? undefined,
      scope: tokens.scope ?? undefined,
    });

    // Clear state cookie
    const response = NextResponse.json(
      {
        ok: true,
        message: "YouTube authentication successful",
        redirectUrl: "/dashboard",
      },
      { status: 200 },
    );

    response.cookies.delete(STATE_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("OAuth token exchange failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Token exchange failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
