import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export type VideoRenderJob = {
  id: string;
  title: string;
  scenes: Array<{
    id: number;
    narration: string;
    imageUrl: string;
    duration: number;
  }>;
  audioPath: string;
  subtitles?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
};

export type VideoRenderResult = {
  success: boolean;
  videoPath?: string;
  error?: string;
  duration?: number;
};

const OUTPUT_DIR = process.env.VIDEO_OUTPUT_DIR || "/tmp/videos";

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function checkFFmpeg(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (url.startsWith("data:")) {
      const base64Data = url.split(",")[1];
      if (base64Data) {
        fs.writeFileSync(outputPath, Buffer.from(base64Data, "base64"));
        resolve();
      } else {
        reject(new Error("Invalid base64 data URL"));
      }
    } else {
      const https = require("https");
      const file = fs.createWriteStream(outputPath);
      https
        .get(url, (response: any) => {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err: any) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
    }
  });
}

function createSubtitleFile(
  subtitles: Array<{ start: number; end: number; text: string }>,
  outputPath: string,
): void {
  const srtContent = subtitles
    .map(
      (sub, index) =>
        `${index + 1}\n${formatTimecode(sub.start)} --> ${formatTimecode(sub.end)}\n${sub.text}\n`,
    )
    .join("\n");

  fs.writeFileSync(outputPath, srtContent);
}

function formatTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

export async function renderVideo(
  job: VideoRenderJob,
): Promise<VideoRenderResult> {
  ensureOutputDir();

  if (!checkFFmpeg()) {
    return {
      success: false,
      error: "FFmpeg is not installed on the server.",
    };
  }

  const jobDir = path.join(OUTPUT_DIR, job.id);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  try {
    // Download all images
    const imageFiles: string[] = [];
    for (let i = 0; i < job.scenes.length; i++) {
      const scene = job.scenes[i];
      const imagePath = path.join(jobDir, `scene_${i}.jpg`);
      await downloadImage(scene.imageUrl, imagePath);
      imageFiles.push(imagePath);
    }

    // Create subtitle file if provided
    const subtitlePath = job.subtitles
      ? path.join(jobDir, "subtitles.srt")
      : null;
    if (job.subtitles && subtitlePath) {
      createSubtitleFile(job.subtitles, subtitlePath);
    }

    // Create concat demux file for FFmpeg
    const concatFile = path.join(jobDir, "concat.txt");
    let totalDuration = 0;
    const concatContent = job.scenes
      .map((scene, i) => {
        totalDuration += scene.duration;
        return `file '${imageFiles[i]}'\nduration ${scene.duration}`;
      })
      .join("\n");

    fs.writeFileSync(concatFile, concatContent);

    // Build FFmpeg command
    const videoPath = path.join(jobDir, "output.mp4");
    let ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -r 30 -vf "scale=1280:720" "${videoPath}"`;

    // Add audio if available
    if (fs.existsSync(job.audioPath)) {
      ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -i "${job.audioPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -vf "scale=1280:720" -c:a aac -shortest "${videoPath}"`;
    }

    // Add subtitles if available
    if (subtitlePath && fs.existsSync(subtitlePath)) {
      ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -i "${job.audioPath}" -vf "subtitles='${subtitlePath}'" -c:v libx264 -pix_fmt yuv420p -r 30 "scale=1280:720" -c:a aac -shortest "${videoPath}"`;
    }

    // Execute FFmpeg
    execSync(ffmpegCmd, { stdio: "inherit" });

    if (fs.existsSync(videoPath)) {
      return {
        success: true,
        videoPath,
        duration: totalDuration,
      };
    } else {
      return {
        success: false,
        error: "FFmpeg did not produce output video.",
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: `Video rendering failed: ${errorMessage}`,
    };
  }
}
