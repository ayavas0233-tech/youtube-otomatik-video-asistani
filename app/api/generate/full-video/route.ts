import { copyFile, mkdir, writeFile } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { generateScriptScenes } from "@/lib/ai-script";
import { generateSceneAudios, VOICES } from "@/lib/tts";
import { generateStyledBackground } from "@/lib/video-visuals";
import { generateSubtitles } from "@/lib/subtitles";
import { generateThumbnail } from "@/lib/thumbnail";
import { composeVideo } from "@/lib/video-composition";

const execFileAsync = promisify(execFile);

async function concatAudioFiles(audioPaths: string[]) {
  const audioDir = path.join(process.cwd(), "tmp", "tts");
  await mkdir(audioDir, { recursive: true });

  const normalizedFileNames = await Promise.all(
    audioPaths.map(async (audioPath, index) => {
      const fileName = `concat-src-${Date.now()}-${index}.mp3`;
      const safePath = path.join(audioDir, fileName);
      await copyFile(audioPath, safePath);
      return fileName;
    }),
  );

  const concatListPath = path.join(audioDir, `concat-${Date.now()}.txt`);
  const mergedAudioPath = path.join(audioDir, `merged-${Date.now()}.mp3`);

  await writeFile(
    concatListPath,
    normalizedFileNames.map((fileName) => `file ${fileName}`).join("\n"),
    "utf8",
  );

  await execFileAsync("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListPath,
    "-c:a",
    "libmp3lame",
    "-q:a",
    "2",
    mergedAudioPath,
  ]);

  return mergedAudioPath;
}

export async function POST(request: Request) {
  const progress: string[] = [];

  try {
    const payload = (await request.json()) as {
      topic?: string;
      durationSec?: number;
      language?: "tr" | "en";
      style?: "modern" | "minimalist" | "vibrant" | "gaming" | "educational";
      resolution?: "720p" | "1080p" | "2k" | "4k";
      voices?: string[];
    };

    progress.push("script");
    const script = await generateScriptScenes({
      topic: payload.topic || "Yapay zeka ile içerik üretimi",
      durationSec: Number(payload.durationSec || 45),
      language: payload.language || "tr",
      style: payload.style || "modern",
    });

    progress.push("tts");
    const sceneAudios = await generateSceneAudios(script.scenes, payload.voices?.length ? payload.voices : [VOICES.rachel]);
    const mergedAudioPath = await concatAudioFiles(sceneAudios.map((audio) => audio.audioPath));

    progress.push("visuals");
    const visual = await generateStyledBackground({
      text: script.title,
      theme: payload.style || "modern",
    });

    progress.push("subtitles");
    const subtitleContent = generateSubtitles(
      script.scenes.map((scene, index) => ({
        text: scene.text,
        durationSec: sceneAudios[index]?.durationSec || scene.durationSec,
      })),
      "srt",
    );

    const subtitleDir = path.join(process.cwd(), "tmp", "subtitles");
    await mkdir(subtitleDir, { recursive: true });
    const subtitlePath = path.join(subtitleDir, `full-video-${Date.now()}.srt`);
    await writeFile(subtitlePath, subtitleContent, "utf8");

    progress.push("thumbnail");
    const thumbnail = await generateThumbnail({
      title: script.title,
      subtitle: payload.topic,
      theme: payload.style || "modern",
    });

    progress.push("video");
    const video = await composeVideo({
      audioPath: mergedAudioPath,
      backgroundPath: visual.imagePath,
      subtitlePath,
      resolution: payload.resolution || "1080p",
      title: script.title,
    });

    return NextResponse.json({
      ok: true,
      progress,
      script,
      sceneAudios: sceneAudios.map((audio) => ({ ...audio, audioPath: path.basename(audio.audioPath) })),
      mergedAudio: path.basename(mergedAudioPath),
      visual: { ...visual, imagePath: path.basename(visual.imagePath) },
      subtitles: { subtitlePath: path.basename(subtitlePath), format: "srt" },
      thumbnail: { ...thumbnail, thumbnailPath: path.basename(thumbnail.thumbnailPath) },
      video: { ...video, videoPath: path.basename(video.videoPath) },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        progress,
        message: error instanceof Error ? error.message : "Full video generation failed.",
      },
      { status: 500 },
    );
  }
}
