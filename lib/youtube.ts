import fs from "fs";

import { google, youtube_v3 } from "googleapis";

type UploadParams = {
  filePath: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "private" | "public" | "unlisted";
  thumbnailPath?: string;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
};

type UploadResult = {
  videoId: string;
  url: string;
};

const RETRYABLE_CODES = new Set([408, 429, 500, 502, 503, 504]);

function createOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/youtube/oauth-callback";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("YouTube upload için GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ve GOOGLE_REFRESH_TOKEN gerekli.");
  }

  const oauth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth.setCredentials({ refresh_token: refreshToken });
  return oauth;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  shouldRetry?: (error: unknown) => boolean,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      const status = (error as { code?: number; response?: { status?: number } })?.response?.status || (error as { code?: number })?.code;

      if (
        attempt > retries ||
        !status ||
        !RETRYABLE_CODES.has(Number(status)) ||
        (shouldRetry ? !shouldRetry(error) : false)
      ) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
}

export async function uploadYouTubeVideo(params: UploadParams): Promise<UploadResult> {
  if (!fs.existsSync(params.filePath)) {
    throw new Error(`Video dosyası bulunamadı: ${params.filePath}`);
  }

  const auth = createOAuthClient();
  await auth.getAccessToken();

  const youtube = google.youtube({ version: "v3", auth });

  const channelResponse = await withRetry(async () => {
    return youtube.channels.list({ part: ["id"], mine: true });
  });

  if (!channelResponse.data.items?.length) {
    throw new Error("YouTube kanal erişimi doğrulanamadı.");
  }

  const stat = fs.statSync(params.filePath);

  const insertWithSafeRetry = async () => {
    let uploadedBytes = 0;

    return withRetry(
      async () => {
      uploadedBytes = 0;

      return youtube.videos.insert(
        {
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: params.title,
              description: params.description,
              tags: params.tags,
              categoryId: "27",
            },
            status: {
              privacyStatus: params.privacyStatus || "private",
              selfDeclaredMadeForKids: false,
            },
          },
          media: {
            body: fs.createReadStream(params.filePath),
          },
        },
        {
          onUploadProgress: (event) => {
            uploadedBytes = event.bytesRead || 0;
            params.onProgress?.(uploadedBytes, stat.size);
          },
        },
      );
      },
      3,
      () => uploadedBytes === 0,
    );
  };

  const insertResponse = await insertWithSafeRetry();

  const videoId = insertResponse.data.id;

  if (!videoId) {
    throw new Error("YouTube video ID dönmedi.");
  }

  const thumbnailPath = params.thumbnailPath;

  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    await withRetry(async () => {
      await youtube.thumbnails.set({
        videoId,
        media: {
          body: fs.createReadStream(thumbnailPath),
        },
      });
    });
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function getYouTubeChannelStatus(): Promise<{
  ok: boolean;
  title?: string;
  channelId?: string;
}> {
  const auth = createOAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  const result = await youtube.channels.list({ part: ["snippet"], mine: true });
  const channel = result.data.items?.[0];

  return {
    ok: Boolean(channel),
    title: channel?.snippet?.title || undefined,
    channelId: channel?.id || undefined,
  };
}

export type YouTubeUploadResult = youtube_v3.Schema$Video;
