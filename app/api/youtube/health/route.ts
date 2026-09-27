import { NextResponse } from "next/server";

export async function GET() {
  const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "ENCRYPTION_KEY"];
  const missing = required.filter((key) => !process.env[key]?.trim());
  const encryptionValid = /^[a-fA-F0-9]{64}$/.test(process.env.ENCRYPTION_KEY || "");

  if (missing.length > 0 || !encryptionValid) {
    return NextResponse.json(
      {
        ok: false,
        message: "YouTube OAuth environment is incomplete.",
        missing,
        encryptionValid,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, message: "YouTube OAuth environment is valid." });
}
