import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKeyBuffer() {
  const hexKey = process.env.ENCRYPTION_KEY;

  if (!hexKey || !/^[a-fA-F0-9]{64}$/.test(hexKey)) {
    throw new Error("ENCRYPTION_KEY must be set as a 64-char hex string.");
  }

  return Buffer.from(hexKey, "hex");
}

export function encryptString(plainText: string): string {
  const key = getKeyBuffer();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptString(payload: string): string {
  const key = getKeyBuffer();
  const buffer = Buffer.from(payload, "base64");

  if (buffer.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Encrypted payload is invalid.");
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
