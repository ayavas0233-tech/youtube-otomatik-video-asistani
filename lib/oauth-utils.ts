const DEVELOPMENT_REDIRECT_URI = "http://localhost:3000/api/youtube/oauth-callback";

export function getRedirectUri(): string | null {
  const configuredUri = process.env.GOOGLE_REDIRECT_URI?.trim();

  if (!configuredUri) {
    console.warn("GOOGLE_REDIRECT_URI is not set.");
    return process.env.NODE_ENV === "production" ? null : DEVELOPMENT_REDIRECT_URI;
  }

  try {
    const url = new URL(configuredUri);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hash
    ) {
      throw new Error("Invalid redirect URI");
    }
  } catch {
    console.warn("GOOGLE_REDIRECT_URI must be a valid HTTP(S) URL.");
    return null;
  }

  return configuredUri;
}
