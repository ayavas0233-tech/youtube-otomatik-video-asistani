import fs from "fs";

import { google } from "googleapis";

import { getAuthenticatedClient, YouTubeConnectionError } from "@/lib/youtube-client";

export type YouTubeUploadOptions = {
  videoPath: string;
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: "private" | "public" | "unlisted";
  thumbnailPath?: string;
  onProgress?: (percent: number) => void;
};

export type YouTubeUploadResult = {
  videoId: string;
  url: string;
};

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
]);

function isRetryableError(error: unknown): boolean {
  const code = (error as { code?: number | string })?.code;
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (typeof code === "string" && RETRYABLE_NETWORK_CODES.has(code)) {
    // Transient network failures (connection reset, timeout, DNS hiccup, etc.)
    return true;
  }

  const numericStatus = typeof code === "number" ? code : status;
  if (typeof numericStatus === "number") {
    // Rate limiting and transient server errors are worth retrying.
    return numericStatus === 429 || (numericStatus >= 500 && numericStatus < 600);
  }

  return false;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Bilinmeyen YouTube yükleme hatası.";
}

/**
 * Uploads a rendered video to YouTube using videos.insert(). The googleapis
 * client automatically performs a resumable upload for media bodies and
 * reports progress via onUploadProgress, which we surface through
 * onProgress scaled between 10% and 100%.
 */
export async function uploadVideoToYouTube(
  options: YouTubeUploadOptions,
): Promise<YouTubeUploadResult> {
  const {
    videoPath,
    title,
    description = "",
    tags,
    privacyStatus = "private",
    thumbnailPath,
    onProgress,
  } = options;

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Yüklenecek video dosyası bulunamadı: ${videoPath}`);
  }

  const fileSize = fs.statSync(videoPath).size;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const auth = await getAuthenticatedClient();
      const youtube = google.youtube({ version: "v3", auth });

      onProgress?.(10);

      const response = await youtube.videos.insert(
        {
          part: ["snippet", "status"],
          notifySubscribers: false,
          requestBody: {
            snippet: {
              title,
              description,
              tags: tags && tags.length > 0 ? tags : undefined,
              categoryId: "22",
            },
            status: {
              privacyStatus,
              selfDeclaredMadeForKids: false,
            },
          },
          media: {
            body: fs.createReadStream(videoPath),
          },
        },
        {
          onUploadProgress: (event) => {
            if (!fileSize || !onProgress) {
              return;
            }
            const uploadFraction = Math.min(1, event.bytesRead / fileSize);
            onProgress(Math.min(95, Math.round(10 + uploadFraction * 85)));
          },
        },
      );

      const videoId = response.data.id;
      if (!videoId) {
        throw new Error("YouTube API bir videoId döndürmedi.");
      }

      if (thumbnailPath && fs.existsSync(thumbnailPath)) {
        try {
          await youtube.thumbnails.set({
            videoId,
            media: { body: fs.createReadStream(thumbnailPath) },
          });
        } catch (thumbnailError) {
          // Thumbnail upload is best-effort; don't fail the whole job for it.
          console.error("Thumbnail yükleme hatası (yoksayıldı):", toErrorMessage(thumbnailError));
        }
      }

      onProgress?.(100);

      return {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (error) {
      lastError = error;

      // A missing/expired OAuth connection can't be fixed by retrying the
      // same upload; fail fast and preserve the error type so callers (e.g.
      // the job worker) can treat it as non-retryable.
      if (error instanceof YouTubeConnectionError) {
        break;
      }

      if (attempt < MAX_ATTEMPTS && isRetryableError(error)) {
        await wait(RETRY_BASE_DELAY_MS * attempt);
        continue;
      }
      break;
    }
  }

  if (lastError instanceof YouTubeConnectionError) {
    throw lastError;
  }

  throw new Error(`YouTube video yüklemesi başarısız: ${toErrorMessage(lastError)}`);
}
