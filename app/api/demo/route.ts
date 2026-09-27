export async function POST(request: Request) {
  const payload = await request.json();

  const plan = {
    title: payload.title || "Yapay Zeka ile Kâr Edin",
    headline: `${payload.title || "Yapay Zeka ile Kâr Edin"} için demo video planı hazır`,
    pillar:
      payload.topic || "Güncel AI iş fırsatları" +
        " için hızlı, net ve etkili bir anlatım akışı oluşturuluyor.",
    steps: [
      "AI senaryosu oluşturuldu ve giriş cümlesi hazırlandı.",
      "Türkçe TTS sesi tanımlandı: " + (payload.voice || "Turkish Female 01"),
      "Görsel üretimi için başlık kartları ve sahne düzeni hazırlandı.",
      "FFmpeg ile video birleştirme ve geçişler planlandı.",
      "Altyazı ve thumbnail taslağı üretimi bekleniyor.",
      "YouTube yükleme adımı sonraki sürümde devreye alınacak.",
    ],
  };

  return Response.json(plan);
}
