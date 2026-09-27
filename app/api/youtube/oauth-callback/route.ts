import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ ok: false, message: "Authorization code bulunamadı." }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/youtube/oauth-callback";

  if (!clientId || !clientSecret) {
    return NextResponse.json({ ok: false, message: "Google OAuth ortamı eksik." }, { status: 500 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    return NextResponse.json({ ok: true, tokens });
  } catch (error) {
    console.error("OAuth token exchange failed", error);
    return NextResponse.json({ ok: false, message: "Token değişimi başarısız." }, { status: 500 });
  }
}
