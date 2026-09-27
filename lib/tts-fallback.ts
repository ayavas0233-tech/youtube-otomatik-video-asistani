export async function generateSpeechWithFallback(params: {
  text: string;
  tryElevenLabs: () => Promise<Buffer>;
  tryOpenAI: () => Promise<Buffer>;
  hasElevenLabsKey: boolean;
}): Promise<Buffer> {
  if (!params.text.trim()) {
    throw new Error("TTS metni boş olamaz.");
  }

  if (params.hasElevenLabsKey) {
    try {
      return await params.tryElevenLabs();
    } catch (error) {
      console.error("ElevenLabs TTS fallback to OpenAI:", error);
    }
  }

  return params.tryOpenAI();
}
