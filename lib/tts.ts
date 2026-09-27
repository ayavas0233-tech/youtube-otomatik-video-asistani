import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const TTS_TMP_DIR = path.join(process.cwd(), "tmp", "tts");
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const MAX_REQ_PER_SEC = 3;
const MIN_DELAY_MS = Math.ceil(1000 / MAX_REQ_PER_SEC);

export const VOICES = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  domi: "AZnzlk1mvXvPwYQcb1W1",
  bella: "EXAVITQu4vr4xnSDxMaL",
  antoni: "ErXwobaYiN19L6eSHGHK",
  elli: "MF3mGyEYCHffgLAFODN8",
  josh: "TxGEqnHWrfWFTfGW9XjX",
  adam: "pNInz6obpgDQGcFmaJgB",
  sam: "yoZ06aMxZJJ28mfd3POQ",
} as const;

export type VoiceKey = keyof typeof VOICES;

export type TTSParams = {
  text: string;
  voiceId?: string;
  modelId?: string;
};

export type TTSResult = {
  audioPath: string;
  fileSize: number;
  durationSec: number;
  voiceId: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFileName(prefix: string) {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${prefix}.mp3`;
}

function resolveVoiceId(voiceId?: string) {
  const allowedVoiceIds = Object.values(VOICES);
  if (voiceId && allowedVoiceIds.includes(voiceId as (typeof allowedVoiceIds)[number])) {
    return voiceId;
  }
  return VOICES.rachel;
}

async function writeAudioBuffer(audioBuffer: Buffer, fileName: string) {
  await mkdir(TTS_TMP_DIR, { recursive: true });
  const audioPath = path.join(TTS_TMP_DIR, fileName);
  await writeFile(audioPath, audioBuffer);
  return audioPath;
}

async function elevenLabsGenerateBuffer({ text, voiceId, modelId = "eleven_multilingual_v2" }: Required<TTSParams>) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is required.");
  }

  const safeVoiceId = resolveVoiceId(voiceId);
  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(safeVoiceId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ElevenLabs request failed (${response.status}): ${errorBody}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function getAudioDuration(audioPath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    audioPath,
  ]);

  const rawDuration = Number(stdout.trim());
  if (!Number.isFinite(rawDuration) || rawDuration <= 0) {
    throw new Error("Could not read audio duration with ffprobe.");
  }

  return Math.ceil(rawDuration);
}

async function applyAudioSpeed(audioPath: string, speed: number) {
  if (speed === 1) {
    return audioPath;
  }

  const normalizedSpeed = Math.max(0.5, Math.min(2, speed));
  const spedPath = path.join(TTS_TMP_DIR, buildFileName("speed"));

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    audioPath,
    "-filter:a",
    `atempo=${normalizedSpeed}`,
    spedPath,
  ]);

  return spedPath;
}

export async function generateTTS({ text, voiceId = VOICES.rachel, modelId = "eleven_multilingual_v2" }: TTSParams): Promise<TTSResult> {
  if (!text.trim()) {
    throw new Error("Text cannot be empty.");
  }

  const safeVoiceId = resolveVoiceId(voiceId);
  const buffer = await elevenLabsGenerateBuffer({ text, voiceId: safeVoiceId, modelId });
  const audioPath = await writeAudioBuffer(buffer, buildFileName("scene"));
  const durationSec = await getAudioDuration(audioPath);

  return {
    audioPath,
    fileSize: buffer.length,
    durationSec,
    voiceId: safeVoiceId,
  };
}

export async function generateSceneAudios(
  scenes: Array<{ text: string }>,
  voiceSelection: Array<string> = [VOICES.rachel],
): Promise<TTSResult[]> {
  const outputs: TTSResult[] = [];

  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i];
    const voiceId = resolveVoiceId(voiceSelection[i % Math.max(voiceSelection.length, 1)]);

    const result = await generateTTS({ text: scene.text, voiceId });
    outputs.push(result);
    await sleep(MIN_DELAY_MS);
  }

  return outputs;
}

export async function generateSpeech({
  text,
  voice,
  speed = 1,
}: {
  text: string;
  voice?: string;
  speed?: number;
}): Promise<Buffer> {
  const voiceId = voice && voice in VOICES ? VOICES[voice as VoiceKey] : VOICES.rachel;
  const result = await generateTTS({ text, voiceId });
  const speedAdjustedPath = await applyAudioSpeed(result.audioPath, speed);
  return readFile(speedAdjustedPath);
}
