import { NextResponse } from "next/server";
import { generateThumbnail } from "@/lib/thumbnail";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      title?: string;
      subtitle?: string;
      theme?: "modern" | "minimalist" | "vibrant" | "gaming" | "educational";
    };

    const result = await generateThumbnail({
      title: payload.title || "Yeni Video",
      subtitle: payload.subtitle,
      theme: payload.theme || "modern",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Thumbnail generation failed." },
      { status: 500 },
    );
  }
}
