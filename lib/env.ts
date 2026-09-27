const REQUIRED_ENV_KEYS = [
  "OPENAI_API_KEY",
  "ELEVENLABS_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "YOUTUBE_SCOPES",
  "ENCRYPTION_KEY",
] as const;

export type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

export type VideoResolution = "720p" | "1080p" | "2k" | "4k";

export function validateEnv() {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const encryptionKey = process.env.ENCRYPTION_KEY || "";

  // 32-byte key in hex is 64 chars.
  if (!/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }

  return {
    openAiApiKey: process.env.OPENAI_API_KEY!,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY!,
    googleClientId: process.env.GOOGLE_CLIENT_ID!,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,
    youtubeScopes: process.env.YOUTUBE_SCOPES!,
    encryptionKey,
  };
}

export function getVideoResolution(value?: string): { width: number; height: number; label: VideoResolution } {
  const normalized = (value || "1080p").toLowerCase() as VideoResolution;

  if (normalized === "720p") {
    return { width: 1280, height: 720, label: "720p" };
  }
  if (normalized === "2k") {
    return { width: 2560, height: 1440, label: "2k" };
  }
  if (normalized === "4k") {
    return { width: 3840, height: 2160, label: "4k" };
  }

  return { width: 1920, height: 1080, label: "1080p" };
}
