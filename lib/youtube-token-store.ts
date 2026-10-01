import fs from "fs";
import path from "path";

import { decrypt, encrypt } from "@/lib/crypto";

export type StoredYouTubeTokens = {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
};

const STORE_DIR = path.join(process.cwd(), "tmp", "youtube-token-store");
const STORE_FILE = path.join(STORE_DIR, "tokens.enc");

function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Persists YouTube OAuth tokens encrypted at rest (AES-256-GCM). Tokens never
 * touch the client; this file lives only on the server under tmp/ and is
 * excluded from version control.
 */
export function saveTokens(tokens: StoredYouTubeTokens): void {
  ensureStoreDir();
  const encrypted = encrypt(JSON.stringify(tokens));
  fs.writeFileSync(STORE_FILE, encrypted, { mode: 0o600 });
}

export function loadTokens(): StoredYouTubeTokens | undefined {
  if (!fs.existsSync(STORE_FILE)) {
    return undefined;
  }

  try {
    const encrypted = fs.readFileSync(STORE_FILE, "utf8");
    const payload = decrypt(encrypted);
    return JSON.parse(payload) as StoredYouTubeTokens;
  } catch (error) {
    console.error("Depolanan YouTube token'ları çözülemedi:", error instanceof Error ? error.message : error);
    return undefined;
  }
}

export function hasStoredTokens(): boolean {
  return fs.existsSync(STORE_FILE);
}

export function clearTokens(): void {
  if (fs.existsSync(STORE_FILE)) {
    fs.rmSync(STORE_FILE, { force: true });
  }
}
