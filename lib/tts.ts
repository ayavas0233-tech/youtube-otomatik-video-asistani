import { openai } from "@/lib/openai";

const voiceMap: Record<
  string,
  "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
> = {
  "Turkish Female 01": "shimmer",
  "Turkish Male 02": "onyx",
  "Neutral Narrator": "alloy",
};

export function resolveTtsVoice(voice?: string) {
  return voiceMap[voice || ""] || "alloy";
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
  if (!text.trim()) {
    throw new Error("TTS metni boş olamaz.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY tanımlı değil.");
  }

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: resolveTtsVoice(voice),
    input: text,
    response_format: "mp3",
    speed,
  });

  return Buffer.from(await response.arrayBuffer());
}
