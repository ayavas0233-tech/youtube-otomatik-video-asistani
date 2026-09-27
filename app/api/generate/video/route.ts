import path from "path";
import { NextResponse } from "next/server";
import { composeVideo } from "@/lib/video-composition";

const TMP_ROOT = path.resolve(process.cwd(), "tmp");

function resolveSafeTmpPath(inputPath?: string) {
  if (!inputPath) {
    return undefined;
  }

  const resolved = path.resolve(inputPath);
  const relative = path.relative(TMP_ROOT, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("File paths must be inside tmp directory.");
  }

  return resolved;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      audioPath?: string;
      backgroundPath?: string;
      subtitlePath?: string;
      resolution?: "720p" | "1080p" | "2k" | "4k";
      title?: string;
    };

    if (!payload.audioPath) {
      return NextResponse.json({ ok: false, message: "audioPath is required." }, { status: 400 });
    }

    const result = await composeVideo({
      audioPath: resolveSafeTmpPath(payload.audioPath)!,
      backgroundPath: resolveSafeTmpPath(payload.backgroundPath),
      subtitlePath: resolveSafeTmpPath(payload.subtitlePath),
      resolution: payload.resolution || "1080p",
      title: payload.title || "Generated Video",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Video composition failed." },
      { status: 500 },
    );
  }
}
