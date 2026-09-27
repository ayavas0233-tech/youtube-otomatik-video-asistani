import { NextResponse } from "next/server";
import { loadRefreshToken } from "@/lib/token-store";

function getYoutubeEnvStatus() {
  const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "ENCRYPTION_KEY"];
  const missing = required.filter((key) => !process.env[key]?.trim());
  const encryptionValid = /^[a-fA-F0-9]{64}$/.test(process.env.ENCRYPTION_KEY || "");

  return {
    envOk: missing.length === 0 && encryptionValid,
    missing,
    encryptionValid,
  };
}

function readSessionKey(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("yt_session_key="))
    ?.slice("yt_session_key=".length);

  return value ? decodeURIComponent(value) : null;
}

export async function GET(request: Request) {
  const envStatus = getYoutubeEnvStatus();
  const sessionKey = readSessionKey(request);
  const refreshToken = sessionKey ? await loadRefreshToken(sessionKey) : null;

  return NextResponse.json({
    ok: envStatus.envOk,
    ...envStatus,
    hasSession: Boolean(sessionKey),
    hasStoredRefreshToken: Boolean(refreshToken),
  });
}
