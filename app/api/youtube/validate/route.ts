import pkg from "googleapis";

const { google } = pkg;

export async function POST(request: Request) {
  const { accessToken, refreshToken } = await request.json();

  if (!accessToken || !refreshToken) {
    return Response.json({ ok: false, message: "Access token ve refresh token gerekli." }, { status: 400 });
  }

  const youtubeClient = google.youtube({ version: "v3", auth: google.auth.fromJSON({
    type: "authorized_user",
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    access_token: accessToken,
  }) as any });

  try {
    const channel = await youtubeClient.channels.list({
      part: ["snippet", "contentDetails"],
      mine: true,
    });

    return Response.json({ ok: true, channel: channel.data.items?.[0] || null });
  } catch (error) {
    console.error("YouTube auth validation failed", error);
    return Response.json({ ok: false, message: "YouTube kanal doğrulaması başarısız." }, { status: 500 });
  }
}
