import { createCipheriv, randomBytes, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type YouTubeTokens = {
  access_token: string;
  refresh_token?: string | null;
  expiry_date?: number | null;
  token_type?: string | null;
  scope?: string | null;
};

const TOKEN_FILE = path.join(process.cwd(), "tmp", "youtube-tokens.enc");

function encryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key || !/^[\da-f]{64}$/i.test(key)) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-character hex string");
  }

  return Buffer.from(key, "hex");
}

export async function saveYouTubeTokens(tokens: YouTubeTokens): Promise<void> {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(tokens), "utf8"),
    cipher.final(),
  ]);
  const encryptedTokens = Buffer.concat([
    iv,
    cipher.getAuthTag(),
    ciphertext,
  ]);

  await fs.mkdir(path.dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });

  const temporaryFile = `${TOKEN_FILE}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, encryptedTokens, {
      flag: "wx",
      mode: 0o600,
    });
    await fs.rename(temporaryFile, TOKEN_FILE);
  } finally {
    await fs.rm(temporaryFile, { force: true });
  }
}
