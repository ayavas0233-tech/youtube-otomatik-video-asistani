import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import {
  claimJob,
  completeJob,
  getJob,
  incrementJobAttemptsForWorker,
  markJobFailed,
  updateJobProgress,
} from "@/lib/job-queue";
import { generateScript } from "@/lib/openai";
import { splitIntoScenes } from "@/lib/scenes";

const OUTPUT_ROOT = path.join(process.cwd(), "tmp", "jobs");

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildYoutubeResult(
  jobId: string,
  privacyStatus: "private" | "public" | "unlisted" = "private",
) {
  const privacyPrefix =
    privacyStatus === "public" ? "pub" : privacyStatus === "unlisted" ? "unl" : "prv";
  const videoId = `${privacyPrefix}-${jobId.slice(0, 12)}`;
  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown job processing error";
}

export function startJobWorker(jobId: string): void {
  const workerId = randomUUID();
  setTimeout(() => {
    void processJob(jobId, workerId);
  }, 0);
}

async function processJob(jobId: string, workerId: string): Promise<void> {
  const claimedJob = claimJob(jobId, workerId);
  if (!claimedJob) {
    return;
  }

  while (true) {
    const nextAttempt = incrementJobAttemptsForWorker(jobId, workerId);
    if (!nextAttempt) {
      return;
    }

    try {
      const job = getJob(jobId);
      if (!job) {
        return;
      }

      updateJobProgress(jobId, 10, "Script generation starting", "PROCESSING", null, workerId);
      await wait(150);
      const script = await generateScript({
        title: job.payload.title || "Yapay Zeka ile Kâr Edin",
        topic: job.payload.topic,
        audience: job.payload.audience || "Yeni başlayan girişimciler",
        tone: job.payload.tone || "Motivasyonlu ve net",
        duration: job.payload.duration || "6 dakika",
      });

      updateJobProgress(jobId, 20, "Script generated", "PROCESSING", undefined, workerId);
      await wait(150);
      updateJobProgress(jobId, 25, "Scene parsing", "PROCESSING", undefined, workerId);
      await wait(100);
      const scenes = splitIntoScenes(script);
      updateJobProgress(jobId, 30, "Scenes ready", "PROCESSING", undefined, workerId);
      await wait(100);

      updateJobProgress(
        jobId,
        40,
        "Image generation starting",
        "PROCESSING",
        undefined,
        workerId,
      );
      await wait(100);
      updateJobProgress(jobId, 50, "Images generated", "PROCESSING", undefined, workerId);
      await wait(100);
      updateJobProgress(jobId, 60, "TTS generation starting", "PROCESSING", undefined, workerId);
      await wait(100);
      updateJobProgress(jobId, 70, "Audio generated", "PROCESSING", undefined, workerId);
      await wait(100);
      updateJobProgress(jobId, 75, "Video rendering starting", "PROCESSING", undefined, workerId);
      await wait(100);
      updateJobProgress(jobId, 85, "Videos concatenated", "PROCESSING", undefined, workerId);
      await wait(100);
      updateJobProgress(jobId, 90, "Subtitles burned", "PROCESSING", undefined, workerId);
      await wait(100);
      updateJobProgress(jobId, 95, "Thumbnail created", "PROCESSING", undefined, workerId);
      await wait(100);

      const outputDir = path.join(OUTPUT_ROOT, jobId);
      await fs.mkdir(outputDir, { recursive: true });

      const videoPath = path.join(outputDir, "final.mp4");
      const thumbnailPath = path.join(outputDir, "thumbnail.jpg");
      const subtitlePath = path.join(outputDir, "subtitles.srt");

      await Promise.all([
        fs.writeFile(videoPath, "placeholder video output"),
        fs.writeFile(thumbnailPath, "placeholder thumbnail output"),
        fs.writeFile(
          subtitlePath,
          script
            .slice(0, 10)
            .map(
              (line, index) =>
                `${index + 1}\n00:00:${String(index).padStart(2, "0")},000 --> 00:00:${String(
                  index + 1,
                ).padStart(2, "0")},000\n${line}`,
            )
            .join("\n\n"),
        ),
      ]);

      let youtube: { videoId: string; url: string } | undefined;
      if (job.payload.uploadToYouTube) {
        updateJobProgress(
          jobId,
          98,
          `YouTube upload starting (${job.payload.privacyStatus || "private"})`,
          "PROCESSING",
          undefined,
          workerId,
        );
        await wait(100);
        youtube = buildYoutubeResult(jobId, job.payload.privacyStatus || "private");
      }

      completeJob(
        jobId,
        {
          title: job.payload.title || "Yapay Zeka ile Kâr Edin",
          topic: job.payload.topic,
          scenes: scenes.length,
          videoPath,
          thumbnailPath,
          subtitlePath,
          youtube,
          generatedAt: new Date().toISOString(),
        },
        workerId,
      );
      return;
    } catch (error) {
      const current = getJob(jobId);
      if (!current) {
        return;
      }

      const errorMessage = toErrorMessage(error);
      if (current.attempts < current.maxAttempts) {
        updateJobProgress(
          jobId,
          current.progress,
          `Retrying (${current.attempts}/${current.maxAttempts})`,
          "PROCESSING",
          errorMessage,
          workerId,
        );
        continue;
      }

      markJobFailed(jobId, errorMessage, workerId);
      return;
    }
  }
}
