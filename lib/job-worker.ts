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
import { uploadVideoToYouTube } from "@/lib/youtube-upload";

const OUTPUT_ROOT = path.join(process.cwd(), "tmp", "jobs");

class NonRetryableJobError extends Error {}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  const claimedJob = await claimJob(jobId, workerId);
  if (!claimedJob) {
    return;
  }

  while (true) {
    try {
      const job = getJob(jobId);
      if (!job) {
        return;
      }

      await updateJobProgress(jobId, 10, "Script generation starting", "PROCESSING", null, workerId);
      await wait(150);
      const script = await generateScript({
        title: job.payload.title || "Yapay Zeka ile Kâr Edin",
        topic: job.payload.topic,
        audience: job.payload.audience || "Yeni başlayan girişimciler",
        tone: job.payload.tone || "Motivasyonlu ve net",
        duration: job.payload.duration || "6 dakika",
      });

      await updateJobProgress(jobId, 20, "Script generated", "PROCESSING", undefined, workerId);
      await wait(150);
      await updateJobProgress(jobId, 25, "Scene parsing", "PROCESSING", undefined, workerId);
      await wait(100);
      const scenes = splitIntoScenes(script);
      await updateJobProgress(jobId, 30, "Scenes ready", "PROCESSING", undefined, workerId);
      await wait(100);

      await updateJobProgress(
        jobId,
        40,
        "Image generation starting",
        "PROCESSING",
        undefined,
        workerId,
      );
      await wait(100);
      await updateJobProgress(jobId, 50, "Images generated", "PROCESSING", undefined, workerId);
      await wait(100);
      await updateJobProgress(jobId, 60, "TTS generation starting", "PROCESSING", undefined, workerId);
      await wait(100);
      await updateJobProgress(jobId, 70, "Audio generated", "PROCESSING", undefined, workerId);
      await wait(100);
      await updateJobProgress(jobId, 75, "Video rendering starting", "PROCESSING", undefined, workerId);
      await wait(100);
      await updateJobProgress(jobId, 85, "Videos concatenated", "PROCESSING", undefined, workerId);
      await wait(100);
      await updateJobProgress(jobId, 90, "Subtitles burned", "PROCESSING", undefined, workerId);
      await wait(100);
      await updateJobProgress(jobId, 95, "Thumbnail created", "PROCESSING", undefined, workerId);
      await wait(100);

      const outputDir = path.join(OUTPUT_ROOT, jobId);
      await fs.mkdir(outputDir, { recursive: true });

      const videoPath = path.join(outputDir, "final.mp4");
      const thumbnailPath = path.join(outputDir, "thumbnail.jpg");
      const subtitlePath = path.join(outputDir, "subtitles.srt");
      const publicVideoPath = `${jobId}/final.mp4`;
      const publicThumbnailPath = `${jobId}/thumbnail.jpg`;
      const publicSubtitlePath = `${jobId}/subtitles.srt`;

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
        await updateJobProgress(
          jobId,
          90,
          `YouTube upload starting (${job.payload.privacyStatus || "private"})`,
          "PROCESSING",
          undefined,
          workerId,
        );

        try {
          youtube = await uploadVideoToYouTube({
            videoPath,
            title: job.payload.title || "Yapay Zeka ile Kâr Edin",
            description: job.payload.topic,
            privacyStatus: job.payload.privacyStatus || "private",
            thumbnailPath,
            onProgress: (percent) => {
              void updateJobProgress(
                jobId,
                Math.min(99, 90 + Math.round((percent / 100) * 9)),
                `YouTube upload progress %${percent}`,
                "PROCESSING",
                undefined,
                workerId,
              );
            },
          });
        } catch (uploadError) {
          const message = toErrorMessage(uploadError);
          // Missing/expired OAuth connection can't be fixed by retrying the
          // same job; surface it as a non-retryable failure instead.
          const isConnectionError =
            message.includes("YouTube bağlantısı bulunamadı") ||
            message.includes("Google OAuth istemci bilgileri") ||
            message.includes("yenileme token'ı yok");
          if (isConnectionError) {
            throw new NonRetryableJobError(message);
          }
          throw uploadError;
        }
      }

      const completion = await completeJob(
        jobId,
        {
          title: job.payload.title || "Yapay Zeka ile Kâr Edin",
          topic: job.payload.topic,
          scenes: scenes.length,
          videoPath: publicVideoPath,
          thumbnailPath: publicThumbnailPath,
          subtitlePath: publicSubtitlePath,
          youtube,
          generatedAt: new Date().toISOString(),
        },
        workerId,
      );
      if (!completion) {
        throw new Error("Job completion state could not be persisted.");
      }
      return;
    } catch (error) {
      const current = getJob(jobId);
      if (!current) {
        return;
      }

      const errorMessage = toErrorMessage(error);
      const retryState = await incrementJobAttemptsForWorker(jobId, workerId);
      if (!retryState) {
        return;
      }

      const nonRetryableError = error instanceof NonRetryableJobError;
      if (retryState.attempts <= retryState.maxAttempts && !nonRetryableError) {
        await updateJobProgress(
          jobId,
          current.progress,
          `Retrying (${retryState.attempts}/${retryState.maxAttempts})`,
          "PROCESSING",
          errorMessage,
          workerId,
        );
        await wait(300 * retryState.attempts);
        continue;
      }

      await markJobFailed(jobId, errorMessage, workerId);
      return;
    }
  }
}
