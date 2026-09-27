import { mkdir, rm, stat } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { getVideoResolution } from "@/lib/env";

const execFileAsync = promisify(execFile);
const VIDEO_DIR = path.join(process.cwd(), "tmp", "videos");
const MAX_VIDEO_SIZE_BYTES = 512 * 1024 * 1024;

export type ComposeVideoInput = {
  audioPath: string;
  backgroundPath?: string;
  subtitlePath?: string;
  resolution?: "720p" | "1080p" | "2k" | "4k";
  title?: string;
};

export type VideoCompositionResult = {
  videoPath: string;
  width: number;
  height: number;
  durationSec: number;
  bitrateKbps: number;
  fileSizeBytes: number;
};

async function getVideoMetadata(videoPath: string) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,bit_rate",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]);

  const [durationRaw, bitrateRaw] = stdout
    .trim()
    .split("\n")
    .filter(Boolean);

  return {
    durationSec: Math.max(1, Math.ceil(Number(durationRaw) || 0)),
    bitrateKbps: Math.max(1, Math.ceil((Number(bitrateRaw) || 0) / 1000)),
  };
}

function escapeSubtitlePath(filePath: string) {
  return filePath
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/'/g, "\\'");
}

export async function composeVideo({
  audioPath,
  backgroundPath,
  subtitlePath,
  resolution = "1080p",
  title = "Generated Video",
}: ComposeVideoInput): Promise<VideoCompositionResult> {
  await mkdir(VIDEO_DIR, { recursive: true });
  const { width, height } = getVideoResolution(resolution);

  const videoPath = path.join(VIDEO_DIR, `video-${Date.now()}.mp4`);

  const filterParts: string[] = [];

  if (subtitlePath) {
    const subtitleExt = path.extname(subtitlePath).toLowerCase();
    if (subtitleExt === ".vtt") {
      throw new Error("VTT subtitles are not supported by FFmpeg subtitles filter. Use SRT or ASS.");
    }
    filterParts.push(`subtitles='${escapeSubtitlePath(subtitlePath)}'`);
  }

  const filter = filterParts.length > 0 ? ["-vf", filterParts.join(",")] : [];

  const inputArgs = backgroundPath
    ? ["-loop", "1", "-i", backgroundPath]
    : ["-f", "lavfi", "-i", `color=c=#0f172a:s=${width}x${height}`];

  await execFileAsync("ffmpeg", [
    "-y",
    ...inputArgs,
    "-i",
    audioPath,
    "-shortest",
    "-r",
    "30",
    "-s",
    `${width}x${height}`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    "-metadata",
    `title=${title}`,
    ...filter,
    videoPath,
  ]);

  const sizeInfo = await stat(videoPath);
  if (sizeInfo.size > MAX_VIDEO_SIZE_BYTES) {
    await rm(videoPath, { force: true });
    throw new Error("Video file exceeds 512MB limit.");
  }

  const metadata = await getVideoMetadata(videoPath);

  return {
    videoPath,
    width,
    height,
    durationSec: metadata.durationSec,
    bitrateKbps: metadata.bitrateKbps,
    fileSizeBytes: sizeInfo.size,
  };
}

export async function cleanupVideoFile(videoPath: string) {
  await rm(videoPath, { force: true });
}
