import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createOAuthState } from "@/lib/oauth-state";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scope = process.env.YOUTUBE_SCOPES || "https://www.googleapis.com/auth/youtube.upload";

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { ok: false, message: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI must be configured." },
      { status: 400 },
    );
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const existingSession = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("yt_session_key="))
    ?.slice("yt_session_key=".length);

  const sessionKey = existingSession ? decodeURIComponent(existingSession) : randomBytes(16).toString("hex");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const state = createOAuthState();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    state,
    scope: scope.split(",").map((item) => item.trim()).filter(Boolean),
  });

  const response = NextResponse.json({ ok: true, authUrl });
  response.cookies.set("yt_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  response.cookies.set("yt_session_key", sessionKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
