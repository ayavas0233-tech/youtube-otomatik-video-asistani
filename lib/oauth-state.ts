import { randomBytes } from "crypto";
import { decryptString, encryptString } from "@/lib/crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

type OAuthStatePayload = {
  nonce: string;
  createdAt: number;
};

function parseStateToken(token: string): OAuthStatePayload | null {
  try {
    const decoded = JSON.parse(decryptString(token)) as OAuthStatePayload;
    if (!decoded?.nonce || typeof decoded.createdAt !== "number") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function createOAuthState() {
  const payload: OAuthStatePayload = {
    nonce: randomBytes(16).toString("hex"),
    createdAt: Date.now(),
  };

  return encryptString(JSON.stringify(payload));
}

export function consumeOAuthState(cookieStateToken: string, callbackStateToken: string) {
  const cookiePayload = parseStateToken(cookieStateToken);
  const callbackPayload = parseStateToken(callbackStateToken);

  if (!cookiePayload || !callbackPayload) {
    return false;
  }

  if (cookiePayload.nonce !== callbackPayload.nonce) {
    return false;
  }

  if (Date.now() - callbackPayload.createdAt > STATE_TTL_MS) {
    return false;
  }

  return true;
}
