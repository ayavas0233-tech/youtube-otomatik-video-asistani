import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { generateSubtitles } from "@/lib/subtitles";

const ALLOWED_FORMATS = new Set(["srt", "vtt", "ass"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      scenes?: Array<{ text: string; durationSec: number }>;
      format?: "srt" | "vtt" | "ass";
    };

    const scenes = payload.scenes || [];
    if (scenes.length === 0) {
      return NextResponse.json({ ok: false, message: "scenes are required." }, { status: 400 });
    }

    const format = payload.format || "srt";
    if (!ALLOWED_FORMATS.has(format)) {
      return NextResponse.json({ ok: false, message: "Invalid subtitle format." }, { status: 400 });
    }

    const subtitleContent = generateSubtitles(scenes, format);

    const subtitleDir = path.join(process.cwd(), "tmp", "subtitles");
    await mkdir(subtitleDir, { recursive: true });

    const subtitlePath = path.join(subtitleDir, `subtitle-${Date.now()}.${format}`);
    await writeFile(subtitlePath, subtitleContent, "utf8");

    return NextResponse.json({ ok: true, subtitlePath, format });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Subtitle generation failed." },
      { status: 500 },
    );
  }
}
