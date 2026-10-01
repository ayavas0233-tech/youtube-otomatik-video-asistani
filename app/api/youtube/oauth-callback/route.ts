import { NextResponse } from "next/server";

import { exchangeCodeForTokens } from "@/lib/youtube-client";
import { clearStateCookie, validateState } from "@/lib/oauth-state-manager";

export const dynamic = "force-dynamic";

function redirectToOAuthPage(query: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL(`/oauth${query}`, appUrl));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const googleError = searchParams.get("error");

  // Google reported an error (e.g. the user denied consent).
  if (googleError) {
    await clearStateCookie();
    return redirectToOAuthPage("?error=access_denied");
  }

  // Constant-time CSRF validation: the returned `state` must match the
  // HttpOnly cookie set when the auth URL was generated.
  if (!(await validateState(state))) {
    await clearStateCookie();
    return redirectToOAuthPage("?error=invalid_state");
  }

  await clearStateCookie();

  if (!code) {
    return redirectToOAuthPage("?error=missing_code");
  }

  try {
    // Tokens are exchanged and encrypted/stored server-side only. They are
    // never included in the redirect URL, response body, or logs.
    await exchangeCodeForTokens(code);
    return redirectToOAuthPage("?status=success");
  } catch (error) {
    console.error("OAuth token exchange failed:", error instanceof Error ? error.message : error);
    return redirectToOAuthPage("?error=token_exchange_failed");
  }
}
