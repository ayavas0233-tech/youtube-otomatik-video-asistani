import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getRedirectUri } from "@/lib/oauth-utils";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ ok: false, message: "Google OAuth için CLIENT_ID ve CLIENT_SECRET tanımlı değil." }, { status: 400 });
  }

  const redirectUri = getRedirectUri();
  if (!redirectUri) {
    return NextResponse.json({ ok: false, message: "GOOGLE_REDIRECT_URI geçerli değil veya tanımlı değil." }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    prompt: "consent",
  });

  return NextResponse.json({ ok: true, authUrl });
}
