import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

type SceneRenderInput = {
  imagePath: string;
  audioPath: string;
  duration: number;
  preset?: "veryfast" | "fast" | "medium";
  resolution?: "1280x720" | "1920x1080";
  audioBitrate?: string;
  videoBitrate?: string;
};

function getFfmpegPath(): string {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(getFfmpegPath(), args);

    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg başarısız oldu (${code}): ${stderr.slice(-3000)}`));
      }
    });
  });
}

export async function renderScene(input: SceneRenderInput, outputPath: string): Promise<void> {
  const resolution = input.resolution || "1920x1080";
  const [width, height] = resolution.split("x");

  await runFFmpeg([
    "-y",
    "-loop",
    "1",
    "-i",
    input.imagePath,
    "-i",
    input.audioPath,
    "-t",
    String(input.duration),
    "-vf",
    `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`,
    "-c:v",
    "libx264",
    "-preset",
    input.preset || "veryfast",
    "-crf",
    "23",
    "-b:v",
    input.videoBitrate || "3500k",
    "-c:a",
    "aac",
    "-b:a",
    input.audioBitrate || "192k",
    "-shortest",
    outputPath,
  ]);
}

export async function concatVideos(videoPaths: string[], outputPath: string): Promise<void> {
  if (!videoPaths.length) {
    throw new Error("Birleştirilecek sahne bulunamadı.");
  }

  const listPath = `${outputPath}.concat.txt`;
  const content = videoPaths
    .map((file) => `file '${path.resolve(file).replace(/'/g, "'\\''")}'`)
    .join("\n");

  await fs.writeFile(listPath, content, "utf8");

  try {
    await runFFmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath]);
  } finally {
    await fs.rm(listPath, { force: true });
  }
}

export async function burnSubtitles(videoPath: string, subtitlePath: string, outputPath: string): Promise<void> {
  const escapedSubtitlePath = subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");

  await runFFmpeg([
    "-y",
    "-i",
    videoPath,
    "-vf",
    `subtitles='${escapedSubtitlePath}':force_style='FontName=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=40'`,
    "-c:a",
    "copy",
    outputPath,
  ]);
}

export async function createThumbnail(imagePath: string, outputPath: string): Promise<void> {
  await runFFmpeg([
    "-y",
    "-i",
    imagePath,
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
    "-frames:v",
    "1",
    outputPath,
  ]);
}
