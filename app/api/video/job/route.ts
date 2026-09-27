import { promises as fs } from "fs";
import path from "path";

const outputDir = path.join(process.cwd(), "tmp");

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const title = payload.title || "Yapay Zeka ile Kâr Edin";
    const topic = payload.topic || "Güncel AI iş fırsatları";
    const tone = payload.tone || "Motivasyonlu ve net";
    const duration = payload.duration || "6 dakika";

    await fs.mkdir(outputDir, { recursive: true });

    const script = [
      "Giriş: İzleyici için çarpıcı bir açılış cümlesi hazırlandı.",
      `Ana konu: ${topic} üzerine net ve anlaşılır açıklama yazıldı.`,
      `Ton: ${tone} anlatım biçimiyle üretim yapıldı.`,
      `Süre hedefi: ${duration}.`,
      "Kapanış: CTA ve sonraki adım çağrısı eklendi.",
    ];

    const subtitle = [
      "00:00:00,000 --> 00:00:03,000 | Merhaba ve hoş geldiniz.",
      "00:00:03,000 --> 00:00:10,000 | Bu videoda AI ve üretim akışını açıklıyoruz.",
      "00:00:10,000 --> 00:00:18,000 | Net bir yapı kurmak, verimliliği artırır.",
      "00:00:18,000 --> 00:00:25,000 | Ardından üretim ve yükleme aşamasına geçiyoruz.",
      "00:00:25,000 --> 00:00:30,000 | İyi seyirler.",
    ];

    const output = {
      ok: true,
      title,
      topic,
      duration,
      script,
      subtitle,
      thumbnailPrompt: `Modern YouTube thumbnail, ${topic}, net yazı, canlı renkler, teknoloji teması, premium görünüm, yüksek kontrast`,
      ffmpegPlan: [
        "Görsel kartları sırala",
        "TTS ses dosyasını ekle",
        "FFmpeg ile kes, geçiş ve birleştirme uygula",
        "Altyazı dosyasını ekle",
        "Thumbnail oluştur",
      ],
      youtubeMetadata: {
        title: `${title} | ${topic}`,
        description: `Bu video ${topic} konusunu anlatır.\n\nAI üretim akışı, TTS, görseller, altyazı ve YouTube dağıtım süreci açıklanır.`,
        tags: ["ai", "youtube", "video", "automation", topic.toLowerCase()],
      },
      generatedAt: new Date().toISOString(),
    };

    const filePath = path.join(outputDir, "video-job.json");
    await fs.writeFile(filePath, JSON.stringify(output, null, 2));

    return Response.json(output);
  } catch (error) {
    console.error("video-job generation failed", error);
    return Response.json({ ok: false, message: "Video iş akışı üretilemedi." }, { status: 500 });
  }
}
