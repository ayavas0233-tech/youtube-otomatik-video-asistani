import { generateScript } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const title = payload.title || "Yapay Zeka ile Kâr Edin";
    const topic = payload.topic || "Güncel AI iş fırsatları";
    const audience = payload.audience || "Yeni başlayan girişimciler";
    const tone = payload.tone || "Motivasyonlu ve net";
    const duration = payload.duration || "6 dakika";

    const script = await generateScript({ title, topic, audience, tone, duration });

    return Response.json({
      ok: true,
      title,
      topic,
      audience,
      tone,
      duration,
      script,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Script generation API error:", error);
    return Response.json(
      { ok: false, message: "Script üretim hatası." },
      { status: 500 },
    );
  }
}
