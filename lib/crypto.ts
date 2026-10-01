import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Reads and validates the server-side token encryption key.
 * Must be a 64-character hex string (32 bytes) for AES-256.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY ortam değişkeni tanımlı değil.");
  }

  const buffer = Buffer.from(key, "hex");
  if (buffer.length !== KEY_LENGTH) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY 32 byte (64 hex karakter) uzunluğunda olmalıdır.",
    );
  }

  return buffer;
}

/**
 * Encrypts plaintext using AES-256-GCM. Output encodes iv + authTag + ciphertext
 * as a single base64 string so it can be stored as one opaque value.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a payload produced by encrypt(). Throws if the payload has been
 * tampered with (authentication tag mismatch) or the key is wrong.
 */
export function decrypt(payload: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(payload, "base64");

  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Şifreli veri bozuk görünüyor.");
  }

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Compares two strings in constant time to avoid leaking information via
 * timing side channels. Safe to use for OAuth `state` / CSRF token checks.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  // Always perform a fixed-cost comparison, even when lengths differ, so the
  // function's timing does not reveal the expected value's length.
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
