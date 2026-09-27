# YouTube Otomatik Video Asistanı

Türkçe, mobil uyumlu ve Next.js + TypeScript tabanlı otomatik video üretim dashboard'ı.

## Özellikler

- Türkçe arayüz
- Mobil uyumlu dashboard
- "Yeni Video Oluştur" formu
- Demo modu
- AI → TTS → Görseller → FFmpeg → Altyazı → Thumbnail → YouTube pipeline görünümü
- Demo API endpoint'i ile örnek video planı üretimi
- Sonraki aşama için YouTube OAuth ve otomatik yükleme hazırlığı

## Başlatma

```bash
npm install
npm run dev
```

Ardından tarayıcıda `http://localhost:3000` adresini açın.

## Demo API

`POST /api/demo` yönlendirmesi, video üretim planını JSON olarak döndürür.

Örnek istek:

```json
{
  "title": "Yapay Zeka ile Kâr Edin",
  "topic": "AI iş fırsatları",
  "voice": "Turkish Female 01"
}
```

## Gelecek Aşama

1. Gerçek veri akışı ve API katmanı
2. YouTube OAuth
3. Video render / FFmpeg işlemleri
4. Tema ve thumbnail üretimi
5. Gerçek API anahtarlarıyla üretim

## Hedef Mimari

- Frontend: Next.js + TypeScript
- AI: OpenAI / Azure OpenAI
- TTS: OpenAI / üçüncü taraf TTS
- Görsel üretimi: image generation API
- Video montaj: FFmpeg
- Altyazı: subtitle engine
- Yükleme: YouTube Data API v3
