import { randomBytes } from "crypto";
import { cookies } from "next/headers";

import { constantTimeEqual } from "@/lib/crypto";

const STATE_COOKIE_NAME = "yt_oauth_state";
const STATE_MAX_AGE_SECONDS = 10 * 60; // 10 minutes

/**
 * Generates a cryptographically random, unguessable state value used for
 * CSRF protection during the OAuth authorization-code flow.
 */
export function generateState(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Stores the state value in an HttpOnly, SameSite cookie so it can be
 * verified when Google redirects back to the callback. The value is never
 * exposed to client-side JavaScript.
 */
export async function setStateCookie(state: string): Promise<void> {
  (await cookies()).set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATE_MAX_AGE_SECONDS,
  });
}

export async function clearStateCookie(): Promise<void> {
  (await cookies()).set(STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Validates the `state` query parameter returned by Google against the
 * HttpOnly cookie set when the auth URL was generated, using a
 * constant-time comparison to prevent timing attacks.
 */
export async function validateState(receivedState: string | null): Promise<boolean> {
  if (!receivedState) {
    return false;
  }

  const expected = (await cookies()).get(STATE_COOKIE_NAME)?.value;
  if (!expected) {
    return false;
  }

  return constantTimeEqual(receivedState, expected);
}
