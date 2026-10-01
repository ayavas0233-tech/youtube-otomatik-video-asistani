import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

import { hasStoredTokens, loadTokens, saveTokens, StoredYouTubeTokens } from "@/lib/youtube-token-store";

/**
 * Thrown when the server has no usable Google OAuth configuration or stored
 * YouTube tokens. Callers (e.g. the job worker) can check for this via
 * `instanceof` to treat the failure as non-retryable, since retrying the
 * same job won't fix a missing/expired connection.
 */
export class YouTubeConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeConnectionError";
  }
}

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

const TOKEN_REFRESH_SKEW_MS = 60 * 1000;

function getOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/youtube/oauth-callback`;

  if (!clientId || !clientSecret) {
    throw new YouTubeConnectionError(
      "Google OAuth istemci bilgileri (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET) eksik.",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function createOAuthClient(): OAuth2Client {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}


/**
 * Builds the Google consent screen URL. The CSRF `state` value must be
 * generated and stored by the caller (see lib/oauth-state-manager.ts).
 */
export function buildAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    scope: YOUTUBE_SCOPES,
    prompt: "consent",
    state,
  });
}

/**
 * Exchanges an authorization code for tokens and persists them encrypted on
 * the server. The caller must never forward the raw tokens to the client.
 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Google OAuth yanıtı bir access_token içermiyor.");
  }

  const existing = loadTokens();
  const stored: StoredYouTubeTokens = {
    accessToken: tokens.access_token,
    // Google only returns a refresh_token on the first consent; keep the
    // previously stored one if a new one isn't issued.
    refreshToken: tokens.refresh_token || existing?.refreshToken,
    expiryDate: tokens.expiry_date ?? undefined,
    scope: tokens.scope,
    tokenType: tokens.token_type ?? undefined,
  };

  saveTokens(stored);
}

/**
 * Returns an OAuth2Client populated with the stored credentials, refreshing
 * the access token first if it is expired (or about to expire).
 *
 * Calls are serialized through a module-level mutex: if two uploads run
 * concurrently, this prevents them from racing to refresh and persist
 * tokens at the same time (which could lose an update or trigger duplicate
 * refresh requests to Google).
 */
let clientMutex: Promise<unknown> = Promise.resolve();

export function getAuthenticatedClient(): Promise<OAuth2Client> {
  const run = clientMutex.then(() => acquireAuthenticatedClient());
  // Keep the chain alive even if this call fails, without propagating the
  // rejection to unrelated callers queued behind it.
  clientMutex = run.catch(() => undefined);
  return run;
}

async function acquireAuthenticatedClient(): Promise<OAuth2Client> {
  const tokens = loadTokens();
  if (!tokens) {
    throw new YouTubeConnectionError("YouTube bağlantısı bulunamadı. Lütfen önce OAuth akışını tamamlayın.");
  }

  const client = createOAuthClient();
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
    scope: tokens.scope,
    token_type: tokens.tokenType,
  });

  // Persist any tokens Google rotates during automatic refreshes.
  client.on("tokens", (newTokens) => {
    saveTokens({
      accessToken: newTokens.access_token || tokens.accessToken,
      refreshToken: newTokens.refresh_token || tokens.refreshToken,
      expiryDate: newTokens.expiry_date ?? tokens.expiryDate,
      scope: newTokens.scope ?? tokens.scope,
      tokenType: newTokens.token_type ?? tokens.tokenType,
    });
  });

  const isExpiring = tokens.expiryDate !== undefined && tokens.expiryDate < Date.now() + TOKEN_REFRESH_SKEW_MS;
  if (isExpiring) {
    if (!tokens.refreshToken) {
      throw new YouTubeConnectionError("Erişim token'ının süresi doldu ve yenileme token'ı yok. Lütfen yeniden bağlanın.");
    }

    const { credentials } = await client.refreshAccessToken();
    // The "tokens" listener above already persisted the refreshed
    // credentials when Google emitted the "tokens" event; just update the
    // in-memory client so subsequent calls in this request use it.
    client.setCredentials(credentials);
  }

  return client;
}

export function isConnected(): boolean {
  return hasStoredTokens();
}
