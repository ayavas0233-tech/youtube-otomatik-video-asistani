import { NextResponse } from "next/server";
import { generateStyledBackground } from "@/lib/video-visuals";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      text?: string;
      theme?: "modern" | "minimalist" | "vibrant" | "gaming" | "educational";
      width?: number;
      height?: number;
    };

    const width = Math.max(320, Math.min(3840, Number(payload.width || 1920)));
    const height = Math.max(320, Math.min(2160, Number(payload.height || 1080)));

    const result = await generateStyledBackground({
      text: payload.text || "YouTube Video",
      theme: payload.theme || "modern",
      width,
      height,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Visual generation failed." },
      { status: 500 },
    );
  }
}
