import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(new URL("/oauth?error=missing_code", appUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/youtube/oauth-callback";

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/oauth?error=missing_env", appUrl));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/oauth?error=missing_access_token", appUrl));
    }

    const response = NextResponse.redirect(new URL("/oauth?status=success", appUrl));
    const secure = process.env.NODE_ENV === "production";
    const accessTokenMaxAge = tokens.expiry_date
      ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
      : undefined;

    response.cookies.set("youtube_access_token", accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: accessTokenMaxAge,
    });

    if (tokens.refresh_token) {
      response.cookies.set("youtube_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error) {
    console.error("OAuth token exchange failed", error);
    return NextResponse.redirect(new URL("/oauth?error=token_exchange_failed", appUrl));
  }
}
