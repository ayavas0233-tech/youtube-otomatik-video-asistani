import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const TOKEN_DIR = path.join(process.cwd(), "tmp", "youtube");
const TOKEN_FILE = path.join(TOKEN_DIR, "tokens.enc");

export interface YouTubeTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
}

interface EncryptedPayload {
  v: number;
  encrypted: string;
  iv: string;
  authTag: string;
}

async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(TOKEN_DIR, { recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") {
      throw error;
    }
  }
}

function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY environment variable is not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  if (keyHex.length !== 64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)",
    );
  }

  return Buffer.from(keyHex, "hex");
}

function encrypt(data: string): { encrypted: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(16);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function decrypt(encrypted: string, iv: string, authTag: string): string {
  const key = getEncryptionKey();

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export async function saveYouTubeTokens(tokens: YouTubeTokens): Promise<void> {
  await ensureDir();

  const encrypted = encrypt(JSON.stringify(tokens));

  const payload: EncryptedPayload = {
    v: 1,
    encrypted: encrypted.encrypted,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  };

  await fs.writeFile(TOKEN_FILE, JSON.stringify(payload));
}

export async function loadYouTubeTokens(): Promise<YouTubeTokens | null> {
  try {
    const content = await fs.readFile(TOKEN_FILE, "utf8");
    const payload = JSON.parse(content) as EncryptedPayload;

    if (payload.v !== 1) {
      throw new Error("Unknown token encryption version");
    }

    const decrypted = decrypt(
      payload.encrypted,
      payload.iv,
      payload.authTag,
    );
    const tokens: YouTubeTokens = JSON.parse(decrypted);

    return tokens;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function clearYouTubeTokens(): Promise<void> {
  try {
    await fs.rm(TOKEN_FILE);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }
  }
}
