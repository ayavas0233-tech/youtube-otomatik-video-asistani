import { generateSpeech } from "@/lib/tts";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const text = String(payload.text || "");
    const voice = String(payload.voice || "Turkish Female 01");
    const speed = Number(payload.speed || 1);

    if (!text.trim()) {
      return Response.json(
        {
          ok: false,
          message: "Seslendirilecek metin boş.",
        },
        { status: 400 },
      );
    }

    const audio = await generateSpeech({
      text,
      voice,
      speed: Math.min(Math.max(speed, 0.5), 2),
    });

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS generation error:", error);

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "TTS üretimi sırasında hata oluştu.",
      },
      { status: 500 },
    );
  }
}
