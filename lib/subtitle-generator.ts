import { promises as fs } from "fs";
import path from "path";

export interface SubtitleCue {
  index: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

function secondsToSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

export function generateSubtitleCues(
  scenes: Array<{ narration: string; duration: number }>,
): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  let currentTime = 0;

  scenes.forEach((scene, index) => {
    const startTime = currentTime;
    const endTime = currentTime + scene.duration;

    cues.push({
      index: index + 1,
      startTime,
      endTime,
      text: scene.narration,
    });

    currentTime = endTime;
  });

  return cues;
}

export function cuesToSRT(cues: SubtitleCue[]): string {
  return cues
    .map((cue) => {
      const startTime = secondsToSRTTime(cue.startTime);
      const endTime = secondsToSRTTime(cue.endTime);
      return `${cue.index}\n${startTime} --> ${endTime}\n${cue.text}`;
    })
    .join("\n\n");
}

export async function saveSRTFile(
  cues: SubtitleCue[],
  outputPath: string,
): Promise<string> {
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  const srtContent = cuesToSRT(cues);
  await fs.writeFile(outputPath, srtContent, "utf8");

  return outputPath;
}

export async function generateAndSaveSRT(
  scenes: Array<{ narration: string; duration: number }>,
  outputPath: string,
): Promise<string> {
  const cues = generateSubtitleCues(scenes);
  return saveSRTFile(cues, outputPath);
}
