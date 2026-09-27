import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { generateImage, saveGeneratedImage } from "@/lib/images";
import { type JobPayload, validateJobPayload } from "@/lib/job-payload";
import { validateVideoPipelineConfig, validateYouTubeConfig } from "@/lib/config";
import { generateScript } from "@/lib/openai";
import { splitIntoScenes } from "@/lib/scenes";
import { createSrt } from "@/lib/subtitles";
import { generateSpeech, resolveTtsVoice } from "@/lib/tts";
import { burnSubtitles, concatVideos, createThumbnail, getAudioDuration, renderScene } from "@/lib/video-render";
import { uploadYouTubeVideo } from "@/lib/youtube";

const outputRoot = path.join(process.cwd(), process.env.UPLOAD_DIR || "tmp/video-jobs");

export const runtime = "nodejs";
export const maxDuration = 300;

type JobStatus = {
  jobId: string;
  status: "running" | "completed" | "failed";
  stage: string;
  updatedAt: string;
  message?: string;
  videoPath?: string;
  subtitlePath?: string;
  thumbnailPath?: string;
  youtube?: { videoId: string; url: string } | null;
};

async function writeJobStatus(jobDir: string, status: JobStatus): Promise<void> {
  await fs.writeFile(path.join(jobDir, "job-status.json"), JSON.stringify(status, null, 2), "utf8");
}

export async function POST(request: Request) {
  const jobId = crypto.randomUUID();
  const jobDir = path.join(outputRoot, jobId);
  let currentStage = "request-validation";

  try {
    const updateStage = async (stage: string, message: string): Promise<void> => {
      currentStage = stage;
      await writeJobStatus(jobDir, {
        jobId,
        status: "running",
        stage,
        updatedAt: new Date().toISOString(),
        message,
      });
    };

    const payload = (await request.json()) as JobPayload;
    const validationError = validateJobPayload(payload);

    if (validationError) {
      return Response.json({ ok: false, jobId, message: validationError }, { status: 400 });
    }

    const configValidation = validateVideoPipelineConfig();
    if (!configValidation.ok) {
      return Response.json(
        {
          ok: false,
          jobId,
          message: "Video pipeline yapılandırması eksik.",
          missing: configValidation.missing,
        },
        { status: 500 },
      );
    }

    const title = payload.title || "Yapay Zeka ile Kâr Edin";
    const topic = payload.topic || "Güncel AI iş fırsatları";
    const audience = payload.audience || "Genel YouTube izleyicisi";
    const tone = payload.tone || "Profesyonel, hızlı ve dikkat çekici";
    const duration = payload.duration || "5 dakika";
    const voice = payload.voice || "Neutral Narrator";
    const uploadToYouTube = payload.uploadToYouTube === true;
    const privacyStatus = payload.privacyStatus || "private";

    if (uploadToYouTube) {
      const youtubeConfig = validateYouTubeConfig();
      if (!youtubeConfig.ok) {
        return Response.json(
          {
            ok: false,
            jobId,
            message: `YouTube env eksik: ${youtubeConfig.missing.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    await fs.mkdir(jobDir, { recursive: true });
    const scenesDir = path.join(jobDir, "scenes");
    await fs.mkdir(scenesDir, { recursive: true });

    await updateStage("script", "Senaryo oluşturuluyor");

    const scriptLines = await generateScript({ title, topic, audience, tone, duration });
    const scriptText = scriptLines.join("\n");

    if (!scriptLines.length) {
      throw new Error("AI senaryosu oluşturulamadı.");
    }

    await updateStage("scene-splitting", "Sahneler hazırlanıyor");

    const scenes = splitIntoScenes(scriptText);
    if (!scenes.length) {
      throw new Error("Video sahneleri oluşturulamadı.");
    }

    const renderedScenes: string[] = [];
    const subtitleItems: { start: number; end: number; text: string }[] = [];
    let timeline = 0;

    for (let index = 0; index < scenes.length; index += 1) {
      const scene = scenes[index];
      const sceneDir = path.join(scenesDir, String(index + 1));
      await fs.mkdir(sceneDir, { recursive: true });

      await updateStage(`scene-${index + 1}`, `Sahne ${index + 1}/${scenes.length} üretiliyor`);

      const generatedImage = await generateImage({ prompt: scene.visualPrompt, size: "1024x1024" });
      const imagePath = path.join(sceneDir, "image.png");
      await saveGeneratedImage(generatedImage, imagePath);

      const audioBuffer = await generateSpeech({
        text: scene.narration,
        voice,
      });

      if (!audioBuffer.length) {
        throw new Error("TTS sesi boş döndü.");
      }

      const audioPath = path.join(sceneDir, "voice.mp3");
      await fs.writeFile(audioPath, audioBuffer);
      const audioDuration = await getAudioDuration(audioPath);
      const sceneDuration = Math.max(scene.duration, Math.ceil(audioDuration));

      const sceneVideo = path.join(sceneDir, "scene.mp4");
      await renderScene(
        {
          imagePath,
          audioPath,
          duration: sceneDuration,
          preset: (process.env.FFMPEG_PRESET as "veryfast" | "fast" | "medium") || "veryfast",
          resolution: (process.env.VIDEO_RESOLUTION as "1280x720" | "1920x1080") || "1920x1080",
          audioBitrate: process.env.AUDIO_BITRATE || "192k",
          videoBitrate: process.env.VIDEO_BITRATE || "3500k",
        },
        sceneVideo,
      );

      renderedScenes.push(sceneVideo);

      subtitleItems.push({
        start: timeline,
        end: timeline + sceneDuration,
        text: scene.narration,
      });

      timeline += sceneDuration;
    }

    await updateStage("merge", "Sahneler birleştiriliyor");

    const baseVideo = path.join(jobDir, "video-base.mp4");
    await concatVideos(renderedScenes, baseVideo);

    const subtitlePath = path.join(jobDir, "subtitles.srt");
    await fs.writeFile(subtitlePath, createSrt(subtitleItems), "utf8");

    const finalVideo = path.join(jobDir, "final.mp4");
    await burnSubtitles(baseVideo, subtitlePath, finalVideo);

    const thumbnailPath = path.join(jobDir, "thumbnail.jpg");
    await createThumbnail(path.join(scenesDir, "1", "image.png"), thumbnailPath);

    const youtubeMetadata = {
      title: `${title} | ${topic}`,
      description: `Bu videoda ${topic} konusu anlatılmaktadır.\n\nVideo otomatik olarak AI senaryo, seslendirme, görsel üretimi, FFmpeg ve altyazı sistemi kullanılarak oluşturuldu.`,
      tags: ["ai", "youtube", "yapayzeka", "otomasyon", "video", topic.toLowerCase()],
      voice,
      resolvedVoice: resolveTtsVoice(voice),
    };

    let youtubeResult: { videoId: string; url: string } | null = null;

    if (uploadToYouTube) {
      await updateStage("youtube-upload", "YouTube yüklemesi başladı");

      youtubeResult = await uploadYouTubeVideo({
        filePath: finalVideo,
        title: youtubeMetadata.title,
        description: youtubeMetadata.description,
        tags: youtubeMetadata.tags,
        privacyStatus,
        thumbnailPath,
      });
    }

    const result = {
      ok: true,
      jobId,
      title,
      topic,
      duration,
      scenes: scenes.length,
      script: scriptText,
      subtitlePath,
      videoPath: finalVideo,
      thumbnailPath,
      youtube: youtubeResult,
      youtubeMetadata,
      generatedAt: new Date().toISOString(),
    };

    await fs.writeFile(path.join(jobDir, "job-result.json"), JSON.stringify(result, null, 2), "utf8");

    await writeJobStatus(jobDir, {
      jobId,
      status: "completed",
      stage: "done",
      updatedAt: new Date().toISOString(),
      message: "Video üretimi tamamlandı",
      videoPath: finalVideo,
      subtitlePath,
      thumbnailPath,
      youtube: youtubeResult,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video üretimi başarısız.";

    try {
      await fs.mkdir(jobDir, { recursive: true });
      await fs.writeFile(path.join(jobDir, "job-error.log"), `${new Date().toISOString()}\n${message}\n`, "utf8");
      await writeJobStatus(jobDir, {
        jobId,
        status: "failed",
        stage: currentStage,
        updatedAt: new Date().toISOString(),
        message,
      });
    } catch (writeError) {
      console.error("JOB ERROR WRITE FAILED:", writeError);
    }

    console.error("VIDEO JOB ERROR:", error);

    return Response.json(
      {
        ok: false,
        jobId,
        message,
        stage: currentStage,
      },
      {
        status: 500,
      },
    );
  }
}
