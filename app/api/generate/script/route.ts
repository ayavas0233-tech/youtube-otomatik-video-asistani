import { NextResponse } from "next/server";
import { generateScriptScenes } from "@/lib/ai-script";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      topic?: string;
      durationSec?: number;
      language?: "tr" | "en";
      style?: "modern" | "minimalist" | "vibrant" | "gaming" | "educational";
    };

    const result = await generateScriptScenes({
      topic: payload.topic || "Yapay zeka ile üretkenlik",
      durationSec: Number(payload.durationSec || 45),
      language: payload.language || "tr",
      style: payload.style || "modern",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Script generation failed." },
      { status: 500 },
    );
  }
}
