export type JobPayload = {
  title?: string;
  topic?: string;
  audience?: string;
  tone?: string;
  duration?: string;
  voice?: string;
  uploadToYouTube?: boolean;
  privacyStatus?: "private" | "public" | "unlisted";
};

export function validateJobPayload(payload: JobPayload): string | null {
  if (payload.title !== undefined && typeof payload.title !== "string") return "title geçersiz";
  if (payload.topic !== undefined && typeof payload.topic !== "string") return "topic geçersiz";
  if (payload.uploadToYouTube !== undefined && typeof payload.uploadToYouTube !== "boolean") return "uploadToYouTube geçersiz";
  if (payload.privacyStatus && !["private", "public", "unlisted"].includes(payload.privacyStatus)) {
    return "privacyStatus geçersiz";
  }

  return null;
}
