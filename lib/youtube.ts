import { google } from "googleapis";
import { loadRefreshToken } from "@/lib/token-store";

function validateYoutubeEnv() {
  const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "ENCRYPTION_KEY"].filter(
    (key) => !process.env[key]?.trim(),
  );

  if (missing.length > 0) {
    throw new Error(`Missing YouTube environment variables: ${missing.join(", ")}`);
  }

  if (!/^[a-fA-F0-9]{64}$/.test(process.env.ENCRYPTION_KEY || "")) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
}

export async function createYoutubeOAuthClient(sessionKey: string) {
  validateYoutubeEnv();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const refreshToken = await loadRefreshToken(sessionKey);
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
}

export async function verifyYoutubeChannelWithClient(oauth2Client: InstanceType<typeof google.auth.OAuth2>) {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
    maxResults: 1,
  });

  const channel = response.data.items?.[0];

  if (!channel || !channel.id) {
    throw new Error("No YouTube channel found for authenticated account.");
  }

  return {
    id: channel.id,
    title: channel.snippet?.title || "Unknown Channel",
    profileImageUrl: channel.snippet?.thumbnails?.default?.url || "",
    subscriberCount: Number(channel.statistics?.subscriberCount || 0),
    videoCount: Number(channel.statistics?.videoCount || 0),
  };
}

export async function verifyYoutubeChannel(sessionKey: string) {
  const oauth2Client = await createYoutubeOAuthClient(sessionKey);
  return verifyYoutubeChannelWithClient(oauth2Client);
}
