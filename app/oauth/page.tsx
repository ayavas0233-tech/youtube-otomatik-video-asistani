import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getRedirectUri } from "@/lib/oauth-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/oauth?error=missing_code", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/oauth?error=missing_env", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const redirectUri = getRedirectUri();
  if (!redirectUri) {
    return NextResponse.redirect(new URL("/oauth?error=missing_env", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    const responseUrl = new URL("/oauth", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    responseUrl.searchParams.set("status", "success");
    responseUrl.searchParams.set("access_token", tokens.access_token || "");
    responseUrl.searchParams.set("refresh_token", tokens.refresh_token || "");

    return NextResponse.redirect(responseUrl);
  } catch (error) {
    console.error("OAuth callback tokenization failed", error);
    return NextResponse.redirect(new URL("/oauth?error=token_exchange_failed", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
}
