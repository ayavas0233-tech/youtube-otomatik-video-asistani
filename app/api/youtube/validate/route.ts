import { NextResponse } from "next/server";
import { verifyYoutubeChannel } from "@/lib/youtube";

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
  try {
    const sessionKey = readSessionKey(request);
    if (!sessionKey) {
      return NextResponse.json({ ok: false, message: "Missing OAuth session. Connect via /oauth first." }, { status: 401 });
    }

    const channel = await verifyYoutubeChannel(sessionKey);
    return NextResponse.json({ ok: true, channel });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Channel validation failed." },
      { status: 400 },
    );
  }
}
