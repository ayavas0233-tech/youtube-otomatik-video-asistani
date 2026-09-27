import { openai } from "@/lib/openai";

const openAiVoiceMap: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
  "Turkish Female 01": "shimmer",
  "Turkish Male 02": "onyx",
  "Neutral Narrator": "alloy",
};

const elevenLabsVoiceMap: Record<string, string> = {
  "Turkish Female 01": process.env.ELEVENLABS_VOICE_TR_FEMALE || "EXAVITQu4vr4xnSDxMaL",
  "Turkish Male 02": process.env.ELEVENLABS_VOICE_TR_MALE || "onwK4e9ZLuTAKqWW03F9",
  "Neutral Narrator": process.env.ELEVENLABS_VOICE_NEUTRAL || "EXAVITQu4vr4xnSDxMaL",
};

export function resolveTtsVoice(voiceName = "Neutral Narrator"): string {
  return elevenLabsVoiceMap[voiceName] || openAiVoiceMap[voiceName] || "alloy";
}

async function generateWithElevenLabs(text: string, voiceName: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY tanımlı değil.");
  }

  const voiceId = elevenLabsVoiceMap[voiceName] || process.env.ELEVENLABS_DEFAULT_VOICE_ID;

  if (!voiceId) {
    throw new Error(`ElevenLabs voice bulunamadı: ${voiceName}`);
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS başarısız: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateWithOpenAI(text: string, voiceName: string, speed: number): Promise<Buffer> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY tanımlı değil.");
  }

  const mapped = openAiVoiceMap[voiceName] || "alloy";
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: mapped,
    input: text,
    response_format: "mp3",
    speed,
  });

  return Buffer.from(await response.arrayBuffer());
}

export async function generateSpeech({
  text,
  voice = "Neutral Narrator",
  speed = 1,
}: {
  text: string;
  voice?: string;
  speed?: number;
}): Promise<Buffer> {
  if (!text.trim()) {
    throw new Error("TTS metni boş olamaz.");
  }

  const safeSpeed = Math.max(0.5, Math.min(speed, 2));

  if (process.env.ELEVENLABS_API_KEY) {
    try {
      return await generateWithElevenLabs(text, voice);
    } catch (error) {
      console.error("ElevenLabs TTS fallback to OpenAI:", error);
    }
  }

  try {
    return await generateWithOpenAI(text, voice, safeSpeed);
  } catch (error) {
    console.error("OpenAI TTS failed:", error);
    throw error;
  }
}
