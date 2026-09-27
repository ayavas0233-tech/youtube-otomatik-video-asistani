import { NextResponse } from "next/server";
import { google } from "googleapis";
import { consumeOAuthState } from "@/lib/oauth-state";
import { encryptString } from "@/lib/crypto";
import { storeRefreshToken } from "@/lib/token-store";

function readCookie(name: string, cookieHeader: string) {
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);

  return value ? decodeURIComponent(value) : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieHeader = request.headers.get("cookie") || "";
  const cookieState = readCookie("yt_oauth_state", cookieHeader);
  const sessionKey = readCookie("yt_session_key", cookieHeader);

  if (!code || !state) {
    return NextResponse.redirect(new URL("/oauth?error=missing_code_or_state", request.url));
  }

  if (!cookieState || !consumeOAuthState(cookieState, state)) {
    const invalidResponse = NextResponse.redirect(new URL("/oauth?error=invalid_state", request.url));
    invalidResponse.cookies.set("yt_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return invalidResponse;
  }

  if (!sessionKey) {
    return NextResponse.redirect(new URL("/oauth?error=missing_session", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/oauth?error=missing_env", request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/oauth?error=missing_refresh_token", request.url));
    }

    const activeSessionKey = `${sessionKey}-${Date.now().toString(36)}`;
    await storeRefreshToken(activeSessionKey, tokens.refresh_token);

    const response = NextResponse.redirect(new URL("/oauth?status=success", request.url));
    response.cookies.set("yt_session_key", activeSessionKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    if (tokens.access_token) {
      response.cookies.set("yt_access_token", encryptString(tokens.access_token), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3600,
      });
    }

    response.cookies.set("yt_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("OAuth token exchange failed", error);
    return NextResponse.redirect(new URL("/oauth?error=token_exchange_failed", request.url));
  }
}
