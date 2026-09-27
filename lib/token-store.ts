import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { decryptString, encryptString } from "@/lib/crypto";

const TOKEN_DIR = path.join(process.cwd(), "tmp", "secure");

function getRefreshTokenPath(sessionKey: string) {
  const safeKey = sessionKey.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(TOKEN_DIR, `youtube-refresh-token-${safeKey}.enc`);
}

export async function storeRefreshToken(sessionKey: string, refreshToken: string) {
  await mkdir(TOKEN_DIR, { recursive: true });
  await writeFile(getRefreshTokenPath(sessionKey), encryptString(refreshToken), "utf8");
}

export async function loadRefreshToken(sessionKey: string): Promise<string | null> {
  try {
    const encrypted = await readFile(getRefreshTokenPath(sessionKey), "utf8");
    return decryptString(encrypted);
  } catch {
    return null;
  }
}

export async function clearRefreshToken(sessionKey: string) {
  await rm(getRefreshTokenPath(sessionKey), { force: true });
}
