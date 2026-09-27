export async function POST(request: Request) {
  const payload = await request.json();

  const title = payload.title || "Yapay Zeka ile Kâr Edin";
  const topic = payload.topic || "Güncel AI iş fırsatları";
  const audience = payload.audience || "Yeni başlayan girişimciler";
  const tone = payload.tone || "Motivasyonlu ve net";
  const voice = payload.voice || "Turkish Female 01";
  const duration = payload.duration || "6 dakika";

  const result = {
    title,
    headline: `${title} için AI üretim planı hazır`,
    summary: `Tema: ${topic} · Hedef: ${audience} · Ton: ${tone} · Süre: ${duration}`,
    stages: [
      { name: "AI Senaryosu", status: "Tamamlandı", detail: "Başlık, giriş, ana maddeler ve kapanış hazır." },
      { name: "TTS", status: "Hazır", detail: `Türkçe ses akışı tanımlandı: ${voice}` },
      { name: "Görseller", status: "Planlandı", detail: "Başlık kartı, arka plan ve sahne taslakları oluşturuluyor." },
      { name: "FFmpeg", status: "Bekliyor", detail: "Video montajı ve geçişler için sıraya alınıyor." },
      { name: "Altyazı", status: "Bekliyor", detail: "Metin eşleştirme ve süre ayarları planlandı." },
      { name: "Thumbnail", status: "Bekliyor", detail: "Yüksek kontrastlı YouTube kapağı hazırlanacak." },
    ],
    script: [
      "Giriş: İzleyici için kısa ve güçlü bir açılış cümlesi oluşturulur.",
      "Sorun: Hedef kitlenin karşılaştığı gerçek sıkıntı açıkça tanımlanır.",
      "Çözüm: AI ile iş fırsatı oluşturma yaklaşımı adım adım anlatılır.",
      "Örnek: Uygulama örnekleri ile konunun somutluğu artırılır.",
      "Kapanış: Sonraki adım ve CTA net şekilde belirtilir.",
    ],
    thumbnailPrompt: `Modern teknoloji teması, net Türkçe yazı, dikkat çeken YouTube kapağı, ${topic}, yüksek kontrast, canlı renkler, mobil uyumlu görünüm`,
    youtubeTitle: `${title} | ${topic} (${duration})`,
  };

  return Response.json(result);
}
